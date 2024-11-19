import React, { useEffect, useState } from 'react';
import Navbar from "../components/Navbar";
import {Typography, Box, Button, Modal, FormControl, Select, MenuItem, InputLabel, Paper} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import 'bootstrap/dist/css/bootstrap.min.css';
import { makeStyles } from '@mui/styles'; // Need this to customize modal

// Allows for customizing the modal without affecting other Paper components
const useStyles = makeStyles((theme) => ({
    modalPaper: {
        ...theme.components.MuiPaper.styleOverrides.modalPaper,
    },
}));

const BlacklistPage = () => {
    const [blacklistedUsers, setBlacklistedUsers] = useState([]);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]); // State for available users
    const [selectedUserToAdd, setSelectedUserToAdd] = useState(''); // State for user selected to be added
    const [isModalOpen, setModalOpen] = useState(false);
    const classes = useStyles();

    // Fetch available users to populate the dropdown
    const fetchAvailableUsers = async () => {
        try {
            const response = await fetch('http://localhost:5011/users'); // Endpoint for fetching all users
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setAvailableUsers(data);
        } catch (error) {
            console.error('Error fetching available users:', error);
        }
    };

    // unction to handle fetching blacklisted users from the server
    const fetchBlacklistedUsers = async () => {
        try {
            const response = await fetch('http://localhost:5011/blacklist');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // Map nested array to flat array for DataGrid
            const mappedData = data.map((user) => ({
                id: user.userId,    // Ensure userId acts as unique identifier for DataGrid
                userName: user.userName,
                userId: user.userId
            }));
            console.log('Mapped blacklist data for DataGrid:', mappedData);
            setBlacklistedUsers(mappedData);
        } catch (error) {
            console.error('Error fetching blacklisted users:', error);
        }
    };

    // Add a new user to the blacklist
    const handleAddUser = async () => {
        if (!selectedUserToAdd) {
            alert('Please select a user to add.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5011/blacklist/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: selectedUserToAdd.userId, userName: selectedUserToAdd.userName })
            });

            if (response.ok) {
                console.log(`User ${selectedUserToAdd.userId} added to the blacklist.`);
                setModalOpen(false);
                fetchBlacklistedUsers(); // Refresh the blacklist
            } else {
                const responseBody = await response.json();
                console.error('Error adding user:', responseBody);
            }
        } catch (error) {
            console.error('Error adding user to the blacklist:', error);
        }
    };


    useEffect(() => {
        fetchBlacklistedUsers();
        fetchAvailableUsers();
    }, []);

    useEffect(() => {
        console.log("Selected User IDs Updated:", selectedUserIds);
    }, [selectedUserIds]);

    const blacklistUserColumns = [
        { field: 'userName', headerName: 'User Name', flex: 1 },
        { field: 'userId', headerName: 'User ID', flex: 1 }
    ];

    // Function to handle user removal from blacklisted users db
    const handleRemoveSelected = async () => {
        // console.log("Inside handleRemoveSelected function"); // Debug line to ensure handleRemoveSelected is firing
        const usersToRemove = [...selectedUserIds]; // Copy current state to a constant
        console.log("Users to remove:", usersToRemove);

        if (usersToRemove.length === 0) {
            console.warn("No users selected for removal.");
            return;
        }

        try {
            await Promise.all(usersToRemove.map(async (userId) => {
                const response = await fetch('http://localhost:5011/blacklist/remove', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId }) // Confirm that this matches the backend expectation
                });
                console.log('Response status:', response.status); // Log response status for debugging
                if (!response.ok) {
                    const responseBody = await response.json();
                    console.error('Error response from server:', responseBody);
                }
            }));
            setSelectedUserIds([]); // Clear selection after removal
            await fetchBlacklistedUsers(); // Refresh the blacklist
        } catch (error) {
            console.error("Error removing selected users:", error);
        }
    };

    return (
        <>
            <Navbar />
            <div className="container my-5">
                <Typography variant="h4" align="center" gutterBottom>
                    Blacklisted Users
                </Typography>

                <div className="container">
                    <Typography variant="body1" className="text-secondary mb-4 justified-text">
                        This page provides an overview of all blacklisted users within the application. You can review
                        and manage blacklisted entries using the table below, which displays user details such as their name and ID.
                        Select users from the table to remove them from the blacklist. Add users to the blacklist via the corresponding button.
                        Toggle refresh to display updated blacklist.
                    </Typography>

                </div>

                <div className="row justify-content-center">
                    <div className="col-md-8">
                        {blacklistedUsers.length > 0 ? (
                            <Box sx={{height: 400, marginBottom: '1rem'}}>
                                <DataGrid
                                    rows={blacklistedUsers}
                                    columns={blacklistUserColumns}
                                    pageSize={5}
                                    checkboxSelection
                                    disableSelectionOnClick
                                    getRowId={(row) => row.userId}
                                    onRowSelectionModelChange={(newSelectionModel) => {
                                        console.log("New Selection Model (raw):", newSelectionModel); // Check the raw event
                                        // Ensure newSelectionModel is an array before updating state
                                        if (Array.isArray(newSelectionModel)) {
                                            console.log("Setting selectedUserIds:", newSelectionModel);
                                            setSelectedUserIds(newSelectionModel);
                                        } else {
                                            console.error("Expected an array for selection model but got:", newSelectionModel);
                                        }
                                    }}
                                />
                            </Box>
                        ) : (
                            <Typography variant="body1" className="text-center">
                                No blacklisted users found.
                            </Typography>
                        )}
                        <div className="d-flex justify-content-center mt-2">
                            <Button
                                variant="contained"
                                className="ms-2"
                                onClick={() => {
                                    console.log("Remove button clicked");
                                    handleRemoveSelected();
                                }}
                            >
                                Remove Selected
                            </Button>
                            <Button
                                variant="contained"
                                className="ms-2"
                                onClick={fetchBlacklistedUsers}
                            >
                                Refresh
                            </Button>
                            <Button
                                variant="contained"
                                className="ms-2"
                                onClick={() => setModalOpen(true)}
                            >
                                Add Users
                            </Button>

                            {/* Modal for adding users */}
                            <Modal open={isModalOpen} onClose={() => setModalOpen(false)} aria-labelledby="modal-title">
                                <Paper className={classes.modalPaper}>
                                    <Typography variant="h6" id="modal-title" gutterBottom>
                                        Add a User to the Blacklist
                                    </Typography>
                                    <FormControl fullWidth margin="normal">
                                        <InputLabel id="user-select-label">Select User</InputLabel>
                                        <Select fullWidth margin="normal"
                                            labelId="user-select-label"
                                            value={selectedUserToAdd}
                                            onChange={(e) => setSelectedUserToAdd(e.target.value)}
                                        >
                                            {/* Placeholder item */}
                                            <MenuItem value="" disabled>
                                                <em>Select a user</em>
                                            </MenuItem>

                                            {/* Map available users */}
                                            {availableUsers.map((user) => (
                                                <MenuItem key={user.userId} value={user}>
                                                    {user.userName}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <Button variant="contained" onClick={handleAddUser} >
                                        Add to Blacklist
                                    </Button>
                                </Paper>
                            </Modal>

                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default BlacklistPage;