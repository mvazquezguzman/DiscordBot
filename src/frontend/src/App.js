import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from './themes/Themes'; // Import the custom theme
import Inactivity from './pages/InactivityPage';
import Home from './pages/Home';
import PurgePage from './pages/PurgePage';
import UserActivityPage from './pages/UserActivityPage';
import LoginPage from "./pages/LoginPage";
import BlacklistPage from "./pages/BlacklistPage";
import AccountPage from "./pages/AccountPage";
import FAQPage from "./pages/FAQPage";
import RolesPage from "./pages/RolesPage";
import ProtectedRoute from './components/ProtectedRoute';
import LoginSuccessPage from './pages/LoginSuccessPage';

function App() {
    const [isAdmin, setIsAdmin] = useState(null);

    // Simulate checking if the user has an admin role
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user')); // Or fetch from your auth provider
        console.log('Retrieved user:', user);

        if (user) {
            const isAdminUser = user.roles.some(role => role.roleName.toLowerCase() === 'admin');
            console.log('Is user an admin?', isAdminUser);
            setIsAdmin(isAdminUser);
        }
    }, []);


    return (
        <ThemeProvider theme={theme}>
            <Router>
                <Routes>
                    {/* Route for login success handling */}
                    <Route path="/login-success" element={<LoginSuccessPage />} />

                    {/* Wrap all routes with ProtectedRoute */}
                    <Route
                        path="/*"
                        element={
                            <ProtectedRoute isAllowed={isAdmin} redirectPath="/login">

                            <Routes>
                                    <Route path="/" element={<Home />} />
                                    <Route path="/useractivity" element={<UserActivityPage />} />
                                    <Route path="/inactivity" element={<Inactivity />} />
                                    <Route path="/purge" element={<PurgePage />} />
                                    <Route path="/blacklist" element={<BlacklistPage />} />
                                    <Route path="/account" element={<AccountPage />} />
                                    <Route path="/faq" element={<FAQPage />} />
                                    <Route path="/roles" element={<RolesPage />} />
                                </Routes>
                            </ProtectedRoute>

                        }
                    />
                    {/* Login page route outside ProtectedRoute */}
                    <Route path="/login" element={<LoginPage />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;
