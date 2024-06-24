import { Grid, Typography } from "@mui/material";
import { useQuery } from '@tanstack/react-query';
import { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import Loading from "../../../components/animation/Loading";
import { onAddCustomerInfo } from "../../../store/slices/customerSlice";
import { onAddCustomer } from "../../../store/slices/stripeSlice";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { TextFontSize20LineHeight30 } from "../../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";
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
            return result
        }
    }
    useEffect(() => {
        const controller = new AbortController()
        sortAndRenderFoundData()
        return () => {
            controller.abort()
        }
    }, [searchParams, consumersFoundQuery.data])

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
                <Grid style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "center", alignSelf: "flex-start" }} item xs={12} sm={12} md={4} lg={4}>
                    <Typography style={{ ...TextFontSize30LineHeight38, fontSize: "36px", lineHeight: "44px", fontWeight: 600, width: "100%", textAlign: "left" }}>Search consumers </Typography><br />
                    <Typography style={{ ...TextFontSize20LineHeight30, width: "100%", textAlign: "left" }}>
                        All consumers matching the search keywords.
                    </Typography>
                </Grid>

                <Grid item xs={12} sm={12} md={8} lg={8}>
                    <Grid container gap={1}>
                        {sortAndRenderFoundData()?.length > 0 ?
                            sortAndRenderFoundData()?.map(item => <Grid key={item.id} item xs={12} sm={12} md={4} lg={4}> <CardSearchConsumersFound props={item} fn={handleConsumerInfo} /></Grid>)
                            : <NoDataFound />}
                    </Grid>
                </Grid>
            </Grid>
        )
    }

}

export default SearchConsumer