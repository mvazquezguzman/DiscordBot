import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Typography, TextField, Button } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../themes/Themes.js'; // Adjust the path as necessary
import '../styles/interfaceSettings.css';

const LoginPage = () => {

    // Function to redirect to Discord authentication
    const handleDiscordLogin = () => {
        window.location.href = 'http://localhost:5011/auth/discord'; // Ensure this matches your server's URL and port
    };

    return (
        <>
            <Navbar />
            <div className="container my-5">
                <div className="row justify-content-center">
                    <div className="col-md-6">
                        <Typography variant="h4" component="h1" align="center" className="mb-4">
                            Login
                        </Typography>
                        {/* Discord Login Button */}
                        <Button
                            variant="contained"
                            className="custom-login-btn w-100"
                            onClick={handleDiscordLogin}
                        >
                            Login with Discord
                        </Button>
                    </div>
                </div>
            </div>

            {/* Reusable Footer Component */}
            <Footer />
        </>
    );
};

export default LoginPage;
