// TODO: Once a user is kicked, they should no longer appear as inactive in the table.
import React, { useEffect, useState } from 'react';
import Navbar from "../components/Navbar";
import { Typography, Box, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import 'bootstrap/dist/css/bootstrap.min.css';
import {FaDiscord} from "react-icons/fa";

const InactivityPage = () => {
    const [inactiveUsers, setInactiveUsers] = useState([]);

    const fetchInactiveUsers = async () => {
        try {
            const response = await fetch('http://localhost:5011/inactivity');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Fetched data:', data);
            setInactiveUsers(data);
        } catch (error) {
            console.error('Error fetching inactive users:', error);
        }
    };

    useEffect(() => {
        fetchInactiveUsers();
    }, []);

    const columns = [
        { field: 'userName', headerName: 'User Name', flex: 1 },
        {
            field: 'lastMessageDate',
            headerName: 'Last Active',
            flex: 1,
            renderCell: (params) => {
                const dateValue = new Date(params.value);
                return isNaN(dateValue.getTime()) ? "Invalid date" : dateValue.toLocaleString();
            },
        },
    ];

    return (
        <>
            <Navbar />
            <div className="container my-4">
                <Typography variant="h4" className="text-center mb-4">
                    Inactive Users
                </Typography>

                <div className="container">
                    <Typography variant="body1" class="descrip">
                        This table provides an overview of inactive users within the application. Use the headers of the
                        table which are toggleable to quickly find specific users. To refresh the table toggle
                        the refresh button below the table.
                    </Typography>
                </div>

                <div className="row justify-content-center">
                    <div className="table table-sm">
                        {inactiveUsers.length > 0 ? (
                            <Box sx={{height: 400, marginBottom: '1rem'}}>
                                <DataGrid
                                    rows={inactiveUsers}
                                    columns={columns}
                                    pageSize={5}
                                    rowsPerPageOptions={[5]}
                                    getRowId={(row) => row.userId}
                                />
                            </Box>
                        ) : (
                            <Typography variant="body1" className="text-center">
                                No inactive users found.
                            </Typography>
                        )}
                        <div className="d-flex justify-content-center mt-2">
                            <Button
                                variant="contained"
                                className="custom-refresh-btn"
                                onClick={fetchInactiveUsers}
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

export default InactivityPage;
