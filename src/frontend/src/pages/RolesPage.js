// TODO: Once the users are kicked, they should no longer appear on the User Roles table.
import Navbar from "../components/Navbar";
import { Typography, Box, Button } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, {useEffect, useState} from "react";
import {DataGrid} from "@mui/x-data-grid";
import 'bootstrap/dist/css/bootstrap.min.css';

const RolesPage = () => {
    const [userInfo, setUserInfo] = useState([]);

    // Fetch user information data
    const fetchUserInfo = async () => {
        console.log('Attempting to fetch user information');
        try {
            const response = await fetch('http://localhost:5011/userinfo');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Fetched user information:', data);
            setUserInfo(data);
        } catch (error) {
            console.error('Error fetching user information:', error);
        }
    };

    useEffect(() => {
        fetchUserInfo();
    }, []);

    const userInfoColumns = [
        { field: 'userName', headerName: 'User Name', width: 150 },
        { field: 'userId', headerName: 'User ID', width: 150 },
        {
            field: 'roles',
            headerName: 'Roles',
            width: 300,
            renderCell: (params) => (
                <div>
                    {params.value.map((role, index) => (
                        <Typography variant="body2" key={index}>
                            {role.roleName}
                        </Typography>
                    ))}
                </div>
            ),
        },
    ];

    return (
        <>
            <Navbar />
            <div className="container my-4">
                <Typography variant="h4" className="text-center mb-4">
                    User Roles
                </Typography>

                <div className="container">
                    <Typography variant="body1" class="descrip">
                        This table provides an overview of each individual users information, including their user name,
                        and user id, along with their role names (multiple roles if applicable). Use the headers of the
                        table which are toggleable to sort users accordingly. To refresh the table toggle the refresh button
                        below the table.
                    </Typography>
                </div>

                <div className="row justify-content-center">
                    <div className="table table-sm">
                        <Box sx={{height: 400, width: '100%'}}>
                            {userInfo.length > 0 ? (
                                <DataGrid
                                    rows={userInfo}
                                    columns={userInfoColumns}
                                    pageSize={5}
                                    rowsPerPageOptions={[5]}
                                    getRowId={(row) => row.userId}
                                />
                            ) : (
                                <Typography variant="body1" className="text-center">
                                    No user information found.
                                </Typography>
                            )}
                        </Box>
                        <div className="d-flex justify-content-center mt-3">
                            <Button variant="contained" onClick={fetchUserInfo}>
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container my-4">
                <Typography variant="h4" className="text-center mb-4">
                    Role Timer
                </Typography>

                <div className="container">
                    <Typography variant="body1" class="descrip">
                        This page provides an overview of the roles and timer for users within the application. You can
                        review and manage assigned role timers and default timers using the table below, which displays
                       the role id, role names, and role timer.
                    </Typography>

                </div>
            </div>
        </>
    );
};

export default RolesPage;
