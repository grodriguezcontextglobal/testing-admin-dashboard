import { Icon } from "@iconify/react"
import { Grid, InputAdornment, OutlinedInput, Typography } from "@mui/material"
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { MagnifyIcon } from "../../../../../../components/icons/Icons"
import { OutlinedInputStyle } from "../../../../../../styles/global/OutlinedInputStyle"
import TextFontsize18LineHeight28 from "../../../../../../styles/global/TextFontSize18LineHeight28"
import StripeTransactionTable from "../StripeTransactionTable"
const TransactionsDetails = () => {
    const [searchValue, setSearchValue] = useState("")
    const { customer } = useSelector((state) => state.stripe)
    useEffect(() => {
        const controller = new AbortController()
        const refreshing = async () => {
            await setSearchValue('.')
            await setSearchValue('')
        }
        refreshing()
        return () => {
            controller.abort()
        }
    }, [customer.uid])

    return (
        <>
            <Grid
                marginY={3}
                display={"flex"}
                justifyContent={"flex-end"}
                alignItems={"center"}
                gap={1}
                container
            >
                <Grid display={'flex'} justifyContent={"flex-end"} alignItems={"center"} item xs={12} sm={12} md={12} lg={12}>
                    <OutlinedInput
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        style={OutlinedInputStyle}
                        fullWidth
                        placeholder="Search a transaction here"
                        startAdornment={
                            <InputAdornment position="start">
                                <MagnifyIcon />
                            </InputAdornment>
                        }
                        endAdornment={
                            <InputAdornment position="end">
                                <Icon
                                    cursor={"pointer"}
                                    icon="ic:baseline-delete-forever"
                                    color="#1e73be"
                                    width="25"
                                    height="25"
                                    opacity={`${String(searchValue).length > 0 ? 1 : 0}`}
                                    onClick={() => {
                                        setSearchValue("");
                                    }}
                                />
                            </InputAdornment>
                        }
                    />
                </Grid>
            </Grid>
            <Grid
                marginY={3}
                display={"flex"}
                justifyContent={"flex-start"}
                alignItems={"center"}
                gap={1}
                container
            >
                <Grid
                    border={"1px solid var(--gray-200, #eaecf0)"}
                    borderRadius={"12px 12px 0 0"}
                    display={"flex"}
                    alignItems={"center"}
                    marginBottom={-2}
                    paddingBottom={-2}
                    item
                    xs={12}
                >
                    <Typography
                        textTransform={"none"}
                        style={TextFontsize18LineHeight28}
                        padding={"24px"}
                    >
                        Transactions
                    </Typography>
                </Grid>
                <Grid item xs={12}>
                    <StripeTransactionTable searchValue={searchValue} />
                </Grid>
            </Grid>
        </>

    )
}

export default TransactionsDetails