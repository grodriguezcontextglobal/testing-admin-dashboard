import { Grid, Typography, OutlinedInput, InputAdornment } from "@mui/material"
import StripeTransactionTable from "../StripeTransactionTable"
import { useForm } from "react-hook-form"
import { OutlinedInputStyle } from "../../../../../../styles/global/OutlinedInputStyle"
import { MagnifyIcon } from "../../../../../../components/icons/Icons"
import { Icon } from "@iconify/react"
import { useEffect } from "react"
const TransactionsDetails = () => {
    const { watch, register, setValue } = useForm()
    useEffect(() => {
        const controller = new AbortController()
        const refreshing = async () => {
          await setValue('searchEvent', '.')
          setTimeout(() => {
            setValue('searchEvent', '')
          }, 200)
        }
        refreshing()
        return () => {
          controller.abort()
        }
      }, [])
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
                        {...register("searchEvent")}
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
                                    opacity={`${watch("searchEvent")?.length > 0 ? 1 : 0}`}
                                    onClick={() => {
                                        setValue("searchEvent", "");
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
                        textAlign={"left"}
                        fontWeight={600}
                        fontSize={"18px"}
                        fontFamily={"Inter"}
                        lineHeight={"28px"}
                        color={"var(--gray-900, #101828)"}
                        padding={"24px"}
                    >
                        Transactions
                    </Typography>
                    <div
                        style={{
                            borderRadius: "16px",
                            background: "var(--blue-dark-50, #EFF4FF)",
                            mixBlendMode: "multiply",
                            width: "fit-content",
                            height: "fit-content",
                        }}
                    ></div>
                </Grid>
                <Grid item xs={12}>
                    <StripeTransactionTable
                        searchValue={watch("searchEvent")}
                    />
                </Grid>
            </Grid>
        </>

    )
}

export default TransactionsDetails