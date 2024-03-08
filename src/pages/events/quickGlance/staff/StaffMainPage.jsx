import { Grid, InputAdornment, OutlinedInput, Typography } from "@mui/material";
import { useForm } from "react-hook-form";

import { MagnifyIcon } from "../../../../components/icons/Icons";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { Title } from "../../../../styles/global/Title";
import StaffTable from "./table/StaffTable";

const StaffMainPage = () => {
    const { register, watch } = useForm();

    return (
        <>
            <Grid
                display={"flex"}
                justifyContent={"flex-start"}
                alignItems={"center"}
                gap={1}
                container
            >
                <Grid
                    display={'flex'}
                    justifyContent={'flex-start'}
                    alignItems={"center"}
                    item
                    xs={12}
                    sm={12}
                    md={12}
                    lg={12}
                >
                    <Typography style={{ ...Title, fontSize: "28px", padding: 0, width: "fit-content" }}>Search staff:&nbsp;</Typography>
                    <Grid item xs sm md lg>
                        <OutlinedInput
                            {...register("searchStaff")}
                            style={OutlinedInputStyle}
                            fullWidth
                            placeholder="Search staff here"
                            startAdornment={
                                <InputAdornment position="start">
                                    <MagnifyIcon />
                                </InputAdornment>
                            }
                        />
                    </Grid>

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
                <Grid item xs={12}>
                  <StaffTable searching={watch('searchStaff')} />
                </Grid>
            </Grid>
        </>
    )
}

export default StaffMainPage