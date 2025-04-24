import React, { useState, useEffect } from 'react';
import Navbar from "../components/Navbar";
import {
    Typography,
    Paper,
    Divider,
    Box,
    Avatar,
    CircularProgress
} from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import Footer from '../components/Footer';

const AccountPage = () => {
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const getUserFromStorage = () => {
        const userString = localStorage.getItem('user');
        return userString ? JSON.parse(userString) : null;
    };

    useEffect(() => {
        const fetchUserInfo = async () => {
            const storedUser = getUserFromStorage();
            if (!storedUser?.id) {
                setError('No user ID found. Please log in again.');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`http://localhost:5011/userinfo`);
                if (!response.ok) {
                    throw new Error('Failed to fetch user information');
                }
                const users = await response.json();

                const currentUser = users.find(user => user.userId === storedUser.id);
                if (currentUser) {
                    setUserInfo(currentUser);
                } else {
                    setError('User information not found');
                }
            } catch (err) {
                setError('Error fetching user information: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUserInfo();
    }, []);

    if (loading) {
        return (
            <>
                <Navbar />
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                    <CircularProgress />
                </Box>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Navbar />
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                    <Typography color="error">{error}</Typography>
                </Box>
            </>
        );
    }

    return (
        <div className="d-flex flex-column align-items-center">
            <Navbar />
            <div className="container mt-5">
                <div className="text-center mb-4">
                    <Typography variant="h2" gutterBottom>
                        Account Details
                    </Typography>
                    <Typography variant="h5" class="descrip">
                        Your Discord Account Information and Roles
                    </Typography>
                </div>

                {/* Account Details Card */}
                <div className="row justify-content-center">
                    <div className="col-md-8 col-lg-6">

                        <Paper elevation={5} className="p-4 mb-4">
                            <Box display="flex" alignItems="center" mb={3}>

                                <Avatar sx={{ mr: 3, width: 56, height: 56 }}>
                                    {/* Add user's profile picture here */}
                                </Avatar>

                                <Box>
                                    <Typography variant="h4" class='titleCol' align="center" gutterBottom>
                                        Hello, {userInfo?.userName || 'Not Available'}!
                                    </Typography>

                                    <Typography variant="body2" color="textSecondary">
                                        Your account information and roles
                                    </Typography>
                                </Box>
                            </Box>

                            <Divider className="mb-3" />
                            <Box mb={3}>
                                <Typography variant="subtitle2" color="textSecondary" mb={1}>
                                    CONNECTED ACCOUNT
                                </Typography>

                                <Typography variant="body1" fontWeight="500">
                                    {userInfo?.userName || 'Not Available'}
                                </Typography>
                            </Box>

                            <Box mb={3}>
                                <Typography variant="subtitle2" color="textSecondary" mb={1}>
                                    SERVER ROLES
                                </Typography>
                                {userInfo?.roles?.map((role, index) => (
                                    <Typography key={index} variant="body1" fontWeight="500">
                                        {role.roleName}
                                    </Typography>
                                )) || 'No roles assigned'}
                            </Box>
                        </Paper>

                    </div>
                </div>
            </div>
            {/* Reusable Footer Component */}
            <Footer />
        </div>
    );
};

export default AccountPage;