import React, { useEffect, useState } from 'react';
import Navbar from "../components/Navbar";
import { Typography, Box, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import 'bootstrap/dist/css/bootstrap.min.css';

const UserActivityPage = () => {
    const [userActivities, setUserActivities] = useState([]);

    const fetchUserActivities = async () => {
        try {
            const response = await fetch('http://localhost:5011/useractivity');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Fetched user activities:', data);
            setUserActivities(data);
        } catch (error) {
            console.error('Error fetching user activities:', error);
        }
    };

    useEffect(() => {
        fetchUserActivities();
    }, []);

    const columns = [
        { field: 'userName', headerName: 'User Name', width: 150, flex: 1 },
        { field: 'channelName', headerName: 'Channel Name', width: 150 },
        {
            field: 'lastActive',
            headerName: 'Last Active',
            width: 200,
            flex: 1,
            renderCell: (params) => {
                const dateValue = new Date(params.value);
                return isNaN(dateValue.getTime()) ? "Invalid date" : dateValue.toLocaleString();
            },
        },
    ];

    return (
        <>
        <Navbar/>
        <div className="container my-4">
            <Typography variant="h4" className="text-center mb-4">
                User Activity Log
            </Typography>

            <div className="container">
                <Typography variant="body1" class="descrip">
                    This table provides an overview of user activity within the application, including their latest
                    messages, reactions, and voice interactions. Use the headers of the table which are toggleable
                    to quickly find specific users or review their recent activities. To refresh the table toggle
                    the refresh button below the table.
                </Typography>
            </div>

            <div className="row justify-content-center">
                <div className="table table-sm">
                    <Box sx={{height: 800, width: '100%'}}>
                        {userActivities.length > 0 ? (
                            <DataGrid
                                rows={userActivities}
                                columns={columns}
                                pageSize={5}
                                rowsPerPageOptions={[5]}
                                getRowId={(row) => row._id}
                            />
                        ) : (
                            <Typography variant="body1" className="text-center">
                                No user activities found.
                            </Typography>
                        )}
                    </Box>
                    <div className="d-flex justify-content-center mt-3"> {/* Centered Refresh Button */}
                        <Button
                            variant="contained"
                            className="custom-refresh-btn"
                            onClick={fetchUserActivities}
                        >
                            Refresh
                        </Button>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};

export default UserActivityPage;
