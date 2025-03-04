import React from 'react';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Typography, Button } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../themes/Themes.js'; // Adjust the path as necessary
import '../styles/interfaceSettings.css';
import { FaDiscord } from "react-icons/fa"; // Import Discord logo icon

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
                            <FaDiscord size={24} className="discord-logo" /> {/* Discord Logo */}
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
