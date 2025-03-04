import React from 'react';
import Navbar from "../components/Navbar";
import { Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import 'bootstrap/dist/css/bootstrap.min.css';

import commandsData from '../JSON/commands.json';
import faqQuestions from '../JSON/faq.json';

const FAQPage = () => {
    console.log("FAQ Page Rendered");

    return (
        <>
            <Navbar />
            <div className="container mt-4">
                <Typography variant="h4" align="center" gutterBottom>
                    Frequently Asked Questions
                </Typography>

                <div className="container">
                    {/* Commands accordion - gets from commands.json in the JSON folder*/}
                    <Accordion className="mb-3">
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="commands-content"
                            id="commands-header"
                        >
                            <Typography variant="body1" className="accordion-question">
                                What are the commands I can use within the server?
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <div className="row">
                                {commandsData.map((item, index) => (
                                    <div className="col-md-6 col-lg-4 mb-3" key={index}>
                                        <div className="card h-100">
                                            <div className="card-body text-center text-dark">
                                                {/* Bold and centered command */}
                                                <Typography variant="h6" class='FAQcolor'>
                                                    {item.command}
                                                </Typography>
                                                {/* Centered and justified description */}
                                                <Typography variant="body1" className="text-justify text-dark" style={{ textAlign: 'center' }}>
                                                    {item.description}
                                                </Typography>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </AccordionDetails>
                    </Accordion>

                    {/* FAQ Accordions - gets from faq.json in the JSON folder*/}
                    {faqQuestions.map((item, index) => (
                        <Accordion className="mb-3" key={index}>
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls={`faq-content-${index}`}
                                id={`faq-header-${index}`}
                            >
                                <Typography variant="body1" className="accordion-question">
                                    {item.question}
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography variant="body1" class='qa'>
                                    {item.answer}
                                </Typography>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </div>
            </div>
        </>
    );
};

export default FAQPage;
