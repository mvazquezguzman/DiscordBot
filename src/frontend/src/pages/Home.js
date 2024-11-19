// Home Landing Page after admin logins in
import React from 'react';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Typography, Paper, Divider } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';

const Home = () => {
    return (
        <div className="d-flex flex-column align-items-center">
            <Navbar />
            <div className="container mt-5">
                <div className="text-center mb-4">
                    <Typography variant="h2" gutterBottom>
                        Welcome
                    </Typography>
                    <Typography variant="h5" className="text-secondary mb-4">
                        Your ultimate solution for managing your automated Discord server activity
                    </Typography>
                </div>

                {/* About Section */}
                <div className="row justify-content-center">
                    <div className="col-md-8 col-lg-6">
                        <Paper elevation={5} className="p-4 rounded-3">
                            <Typography variant="h4" align="center" gutterBottom>
                                About
                            </Typography>
                            <Divider className="my-3" />

                            <Typography variant="body1" className="text-justify mb-3">
                                This automated Discord bot is designed to help manage and maintain your Discord server with ease. It includes features such as user activity tracking, inactivity tracking, automated responses, purging, blacklisting, user management and bot setting management.
                            </Typography>
                            <Typography variant="body1" className="text-justify mb-3">
                                Our goal is to enhance the Discord experience by automating repetitive tasks and improving community engagement.
                            </Typography>
                            <Typography variant="body1" className="text-justify mb-3">
                                If you have any questions or suggestions, feel free check out our FAQ page.
                            </Typography>

                        </Paper>
                    </div>
                </div>
            </div>

            {/* Reusable Footer Component */}
            <Footer />
        </div>
    );
};

export default Home;