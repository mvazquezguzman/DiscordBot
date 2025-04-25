import React from 'react';
import Navbar from "../components/Navbar";
import PurgeHistory from "../components/PurgeHistory";
import { useState } from 'react';
import {
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Box,
    CircularProgress,
    Paper
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import 'bootstrap/dist/css/bootstrap.min.css';
import RefreshIcon from '@mui/icons-material/Refresh';

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    marginTop: theme.spacing(3),
    height: '100%'
}));

const PurgePage = () => {
    const [inactiveUsers, setInactiveUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [purgeInProgress, setPurgeInProgress] = useState(false);

    const columns = [
        {
            field: 'userName',
            headerName: 'Username',
            flex: 1
        },
        {
            field: 'formattedLastActive',
            headerName: 'Last Active Date',
            flex: 1,
            renderCell: (params) => {
                const dateValue = new Date(params.value);
                return isNaN(dateValue.getTime()) ? "Invalid date" : dateValue.toLocaleString();
            }
        },
        {
            field: 'timeSinceActive',
            headerName: 'Time Since Last Active',
            flex: 1,
            renderCell: (params) => {
                const lastActive = new Date(params.row.lastMessageDate);
                if (isNaN(lastActive.getTime())) return "Unknown";

                const now = new Date();
                const diffMs = now - lastActive;
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                return `${diffDays}d ${diffHours}h`;
            }
        }
    ];

    const fetchInactiveUsers = async () => {

        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:5011/inactivity', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch users: ${response.statusText}`);
            }

            const data = await response.json();
            // Log the raw data to see its structure
            console.log('Raw data:', data);

            //TODO: This should work when timer is figured out, but check back anyway to make sure
            // Transform the data into the correct format
            const processedData = data.map(user => {
                return {
                    id: user.userId || Math.random().toString(),
                    userName: user.userName || 'Unknown User',
                    lastMessageDate: user.lastMessageDate || null,
                    // Add computed fields directly to avoid valueGetter errors
                    formattedLastActive: user.lastMessageDate ?
                        new Date(user.lastMessageDate).toLocaleDateString() : '',
                    daysInactive: user.lastMessageDate ?
                        Math.floor((new Date() - new Date(user.lastMessageDate)) / (1000 * 60 * 60 * 24)) : ''
                };
            });

            console.log('Processed Data:', processedData);
            setInactiveUsers(processedData);
        } catch (err) {
            console.error('Fetch error:', err);
            setError(err.message || 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handlePurge = async () => {
        setPurgeInProgress(true);
        try {
            //Get user dat from localStorage
            const currentUser = JSON.parse(localStorage.getItem('user'));

            //Debug
            //console.log("Current user:", currentUser);

            if (!currentUser || !currentUser.id) {
                throw new Error("User information not found");
            }

            const response = await fetch('http://localhost:5011/purge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    executorId: currentUser.id,
                    executorUsername: currentUser.username
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || `Failed to execute purge: ${response.statusText}`);
            }

            const data = await response.json();
            setOpenDialog(false);
            setInactiveUsers([]);
            setError(`Successfully purged ${data.purgedCount} users`);
        } catch (error) {
            console.error('Purge error:', error);
            setError(error.message || 'An unknown error occurred');
        } finally {
            setPurgeInProgress(false);
            setOpenDialog(false);
        }
    };

    return (
        <>
            <Navbar />

            <div className="container my-5">
                <Typography variant="h4" align="center" gutterBottom>
                    User Purge Management
                </Typography>

                <div className="container">
                    <Typography variant="body1" class="descrip">
                        This section provides an overview of the inactive users in the server when toggling the Preview Inactive Users
                        button. The Initiate Purge button will trigger an alert confirming the purge prior to initiation.
                    </Typography>
                </div>

                <div className="row justify-content-center">
                    <div className="table table-sm">
                        {error && (
                            <Alert
                                severity={error.includes('Successfully') ? 'success' : 'error'}
                                sx={{mb: 3}}
                                onClose={() => setError(null)}
                            >
                                {error}
                            </Alert>
                        )}


                        <div className="d-flex justify-content-center mb-3 gap-2">
                            <Button
                                variant="contained"
                                className="custom-refresh-btn"
                                onClick={fetchInactiveUsers}
                                disabled={loading || purgeInProgress}
                            >
                                {loading ? 'Loading...' : 'Preview Inactive Users'}
                            </Button>

                            <Button
                                variant="outlined"
                                onClick={fetchInactiveUsers}
                                disabled={loading || purgeInProgress}
                                startIcon={<RefreshIcon />}
                            >
                                Refresh
                            </Button>
                        </div>

                        {inactiveUsers.length > 0 ? (
                            <>
                                <Box sx={{height: 400, marginBottom: '1rem'}}>
                                    <DataGrid
                                        rows={inactiveUsers}
                                        columns={columns}
                                        initialState={{
                                            pagination: {
                                                paginationModel: {pageSize: 5}
                                            },
                                        }}
                                        pageSizeOptions={[5, 10, 20]}
                                        getRowId={(row) => row.id}
                                        loading={loading}
                                        disableRowSelectionOnClick
                                    />
                                </Box>

                                <div className="d-flex justify-content-center mt-2">
                                    <Button
                                        variant="contained"
                                        className="custom-refresh-btn"
                                        onClick={() => setOpenDialog(true)}
                                        disabled={purgeInProgress}
                                    >
                                        Initiate Purge
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <Typography variant="body1" className="text-center">
                                No inactive users found.
                            </Typography>
                        )}

                        <Dialog
                            open={openDialog}
                            onClose={() => !purgeInProgress && setOpenDialog(false)}
                        >
                            <DialogTitle>
                                Confirm Purge
                            </DialogTitle>
                            <DialogContent>
                                <Typography>
                                    This action will remove {inactiveUsers.length} inactive users from the server.
                                    This action cannot be undone.
                                </Typography>
                            </DialogContent>
                            <DialogActions>
                                <Button
                                    className="custom-refresh-btn"
                                    onClick={() => setOpenDialog(false)}
                                    disabled={purgeInProgress}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="custom-refresh-btn"
                                    onClick={handlePurge}
                                    disabled={purgeInProgress}
                                >
                                    {purgeInProgress ? (
                                        <CircularProgress size={24} color="inherit" />
                                    ) : (
                                        'Confirm Purge'
                                    )}
                                </Button>
                            </DialogActions>
                        </Dialog>
                    </div>

                    <div className="container my-4">
                        <PurgeHistory/>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PurgePage;