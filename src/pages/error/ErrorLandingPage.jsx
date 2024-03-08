import { Grid, Typography } from '@mui/material';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import CenteringGrid from '../../styles/global/CenteringGrid';
import { Title } from '../../styles/global/Title';
const ErrorLandingPage = () => {
    const [messageApi, contextHolder] = message.useMessage();
    const key = 'updatable';
    const navigate = useNavigate()
    const openMessage = () => {
        setTimeout(async () => {
            await messageApi.open({
                key,
                type: 'loading',
                content: 'redirecting...',
                duration: 2
            }); 
            await messageApi.open({
                key,
                type: 'success',
                content: 'Keep using Devitrak App!',
                duration: 1,
            });
            navigate('/')
        },1000);
    };
    openMessage()
    return (
        <>
            {contextHolder}
            <Grid container style={CenteringGrid}>
                <Grid item xs={10} sm={10} md={10} lg={10} style={CenteringGrid}>
                    <Typography style={{...Title, backgroundColor:"var(--blue700)", color:"var(--basewhite)", textDecoration:"underline", borderRadius:"5px"}}>Page not found, We&apos;re redirecting you to home page.</Typography>
                </Grid>
            </Grid>
        </>
    );
};

export default ErrorLandingPage;