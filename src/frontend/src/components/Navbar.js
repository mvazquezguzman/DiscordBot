// Navbar component needs to be added to each page to render the Navbar and Sidebar
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Container, Drawer, List, ListItem, ListItemText, Divider } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ListAltIcon from '@mui/icons-material/ListAlt'; // Icon for the "Commands" button
import {ManageAccounts} from "@mui/icons-material";
import LogoutIcon from '@mui/icons-material/Logout';
import QuizIcon from '@mui/icons-material/Quiz';

const Navbar = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false); // State for controlling the sidebar
    const location = useLocation();
    const navigate = useNavigate(); // Use the useNavigate hook

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        console.log("Logged out");
        navigate('/login');

    }

    // Define routes where you don't want to show the menu icon
    const hideMenuIconRoutes = ['/login', '/signup'];

    // Toggle the sidebar (Drawer)
    const toggleDrawer = (open) => (event) => {
        if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
            return;
        }
        setDrawerOpen(open);
    };

    return (
        <>
            <AppBar position="static">
                <Container maxWidth="lg">
                    <Toolbar>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                            Automated Purge Discord Bot Dashboard
                        </Typography>

                        {/* Conditionally render the menu icon */}
                        {!hideMenuIconRoutes.includes(location.pathname) && (
                            <>
                                <IconButton
                                    edge="end"
                                    color="inherit"
                                    aria-label="menu"
                                    onClick={handleMenuOpen}
                                >
                                    <MenuIcon />
                                </IconButton>

                                <Menu
                                    anchorEl={anchorEl}
                                    open={Boolean(anchorEl)}
                                    onClose={handleMenuClose}
                                    anchorOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'right',
                                    }}
                                    transformOrigin={{
                                        vertical: 'top',
                                        horizontal: 'right',
                                    }}
                                    PaperProps={{
                                        sx: {
                                            overflow: 'visible',
                                            minWidth: '200px',
                                            '& .MuiMenuItem-root': {
                                                whiteSpace: 'nowrap',
                                            },
                                        },
                                    }}
                                >
                                    <MenuItem component={Link} to="/" onClick={handleMenuClose}>Home</MenuItem>

                                    <MenuItem component={Link} to="/account" onClick={handleMenuClose}>Account
                                        <ManageAccounts sx={{ ml: 1 }} />
                                    </MenuItem>

                                    <MenuItem onClick={toggleDrawer(true)}>Commands
                                        <ListAltIcon sx={{ ml: 1 }} />
                                    </MenuItem>

                                    <MenuItem component={Link} to="/faq" onClick={handleLogout}>FAQ
                                        <QuizIcon sx={{ ml: 1 }} />
                                    </MenuItem> {/* Logout Menu Item */}

                                    <MenuItem component={Link} to="/login" onClick={handleLogout}>Logout
                                        <LogoutIcon sx={{ ml: 1 }} />
                                    </MenuItem>
                                </Menu>
                            </>
                        )}
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Sidebar (Drawer) */}
            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={toggleDrawer(false)}
                PaperProps={{
                    sx: { top: '98px' } // Adjust start of sidebar based AppBar height
                }}
            >
                <div
                    role="presentation"
                    onClick={toggleDrawer(false)}
                    onKeyDown={toggleDrawer(false)}
                    style={{ width: 250 }}
                >
                    <List>
                        <ListItem>
                            <Typography className="sidebar-title" variant="h6" sx={{ marginLeft: 1 }}>COMMANDS</Typography>
                        </ListItem>
                        <Divider />
                        <ListItem button className="sidebar-item" component={Link} to="/useractivity">
                            <ListItemText primary="User Activity" />
                        </ListItem>
                        <ListItem button className="sidebar-item" component={Link} to="/inactivity">
                            <ListItemText primary="Inactivity" />
                        </ListItem>
                        <ListItem button className="sidebar-item" component={Link} to="/purge">
                            <ListItemText primary="Purge" />
                        </ListItem>
                        <ListItem button className="sidebar-item" component={Link} to="/blacklist">
                            <ListItemText primary="Blacklist" />
                        </ListItem>
                        <ListItem button className="sidebar-item" component={Link} to="/roles">
                            <ListItemText primary="Roles & Timers" />
                        </ListItem>
                    </List>
                </div>
            </Drawer>
        </>
    );
};

export default Navbar;