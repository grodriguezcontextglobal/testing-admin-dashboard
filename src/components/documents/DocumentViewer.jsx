import { useState } from 'react';
import { Document, Page } from 'react-pdf';
import { Paper, Box, Typography } from '@mui/material';

const DocumentViewer = ({ documentUrl, title }) => {
    const [numPages, setNumPages] = useState(1);
    // eslint-disable-next-line no-unused-vars
    const [pageNumber, setPageNumber] = useState(1);

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>{title}</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Document
                    file={documentUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                >
                    <Page pageNumber={pageNumber} />
                </Document>
            </Box>
            <Typography textAlign="center">
                Page {pageNumber} of {numPages}
            </Typography>
        </Paper>
    );
};

export default DocumentViewer;