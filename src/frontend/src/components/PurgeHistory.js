import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Typography, Box, CircularProgress, Paper } from '@mui/material';

function PurgeHistory() {
    const [purgeHistory, setPurgeHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPurgeHistory = async () => {
            try {
                const response = await axios.get(`http://localhost:5011/purge-history`, {
                    credentials: 'include'
                });
                console.log('Purge history response:', response.data);
                setPurgeHistory(response.data);
                setError(null);
            } catch (err) {
                console.error('Error fetching purge history:', err);
                setError('Failed to fetch purge history. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchPurgeHistory();
    }, []);

    const formatDate = (dateString) => {
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    return (
        <div className="container mt-4">
            <Typography variant="h4" className="text-center mb-4">
                Purge History
            </Typography>

            <div className="container">
                <Typography variant="body1" className="text-secondary mb-4 justified-text">
                    This section provides a log of admins who had initiated a purge, and what users were purged. It also
                    displays the date and time of the initiated purge.
                </Typography>
            </div>

            <Box className="row justify-content-center">
                <div className="col-md-8">
                    {loading ? (
                        <div className="d-flex justify-content-center align-items-center" style={{height: '200px'}}>
                            <CircularProgress/>
                        </div>
                    ) : error ? (
                        <Typography color="error" className="text-center">{error}</Typography>
                    ) : purgeHistory.length === 0 ? (
                        <Typography>No purge history available.</Typography>
                    ) : (
                        <Box className="overflow-auto" style={{maxHeight: '400px'}}>
                            {purgeHistory.slice(0, 3).map((purge, index) => (
                                <Paper
                                    key={index}
                                    elevation={1}
                                    className="mb-3 p-3"
                                    sx={{
                                        p: 2,
                                        bgcolor: '#f5f0e6',  // Beige background color
                                        borderRadius: 1,
                                        '&:hover': {
                                            bgcolor: '#f0e9dd'  // Slightly darker beige on hover
                                        }
                                    }}
                                >
                                    <Typography variant="subtitle1" sx={{color: '#2c2c2c'}}>
                                        <strong>{purge.username}</strong> purged {purge.purgedUsers?.length || 0} users
                                    </Typography>
                                    <Typography variant="body2" sx={{color: '#666'}}>
                                        {formatDate(purge.executionDate)}
                                    </Typography>
                                </Paper>
                            ))}
                        </Box>
                    )}
                </div>
            </Box>
        </div>
    );
}

export default PurgeHistory;