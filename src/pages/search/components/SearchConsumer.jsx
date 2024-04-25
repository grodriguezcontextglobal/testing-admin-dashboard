import { Grid, Typography } from "@mui/material";
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import Loading from "../../../components/animation/Loading";
import { onAddCustomerInfo } from "../../../store/slices/customerSlice";
import { onAddCustomer } from "../../../store/slices/stripeSlice";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { Subtitle } from "../../../styles/global/Subtitle";
import CardSearchConsumersFound from "../utils/CardSearchConsumerFound";
import NoDataFound from "../utils/NoDataFound";
const SearchConsumer = ({ searchParams }) => {
    const { user } = useSelector((state) => state.admin)
    const consumersFoundQuery = useQuery({
        queryKey: ['consumersList'],
        queryFn: () => devitrakApi.post('/auth/user-query', {
            provider: user.company,
        })
    })
    const counting = useRef()
    const dispatch = useDispatch()
    const navigate = useNavigate()
    useEffect(() => {
        const controller = new AbortController()
        consumersFoundQuery.refetch()
        return () => {
            controller.abort()
        }
    }, [searchParams])

    const sortAndRenderFoundData = () => {
        if (consumersFoundQuery.data) {
            const foundData = consumersFoundQuery.data.data.users
            const result = foundData.filter(element => JSON.stringify(element).toLowerCase().includes(`${searchParams}`.toLowerCase()))
            counting.current = result.length ?? 0
            return result
        }
    }
    useEffect(() => {
        const controller = new AbortController()
        sortAndRenderFoundData()
        return () => {
            controller.abort()
        }
    }, [searchParams])

    const handleConsumerInfo = (props) => {    
        let userFormatData = {
            uid: props?.id,
            name: props?.name,
            lastName: props?.lastName,
            email: props?.email,
            phoneNumber: props?.phoneNumber,
            data: props
        };
        dispatch(onAddCustomerInfo(userFormatData));
        dispatch(onAddCustomer(userFormatData));
        navigate(`/consumers/${userFormatData.uid}`);

    }


    if (consumersFoundQuery.isLoading) return <div style={CenteringGrid}><Loading /></div>
    if (consumersFoundQuery.data) {

        return (
            <Grid container style={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
                <Grid style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "center" }} item xs={12} sm={12} md={4} lg={4}>
                    <Typography style={{ width: "100%", textAlign: "left" }}>Search consumers </Typography><br />
                    <Typography style={{ ...Subtitle, width: "100%", textAlign: "left" }}>
                        All consumers matching the search keywords.
                    </Typography>
                </Grid>

                <Grid item xs={12} sm={12} md={8} lg={8}>
                    <Grid container gap={1}>
                        {sortAndRenderFoundData()?.length > 0 ?
                            sortAndRenderFoundData()?.map(item => <Grid key={item.id} item xs={12} sm={12} md={3} lg={3}> <CardSearchConsumersFound props={item} fn={handleConsumerInfo} /></Grid>)
                            : <NoDataFound />}
                    </Grid>
                </Grid>
            </Grid>
        )
    }

}

export default SearchConsumer