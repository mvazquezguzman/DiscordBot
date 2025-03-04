// This component is for a reusable footer
import React from 'react';
import { Typography } from '@mui/material';

const Footer = () => {
    return (
        <footer style={{ textAlign: 'center', marginTop: '20px', padding: '10px', fontSize: '0.9em', color: '#777' }}>
            <Typography variant="body2" class='footerColor'>
                © 2024 BashBot. All rights reserved.
            </Typography>
            <Typography variant="body2" class='footerColor'>
                This project is licensed under the <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener noreferrer">MIT License</a>.
            </Typography>
        </footer>
    );
};

export default Footer;
