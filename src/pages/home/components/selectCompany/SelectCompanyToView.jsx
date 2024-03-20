import { Grid } from "@mui/material"
import { Modal, Space } from "antd"
import CompanyChoiceCard from "./CompanyChoiceCard"
import renderingTitle from "../../../../components/general/renderingTitle"
import { useDispatch, useSelector } from "react-redux"
import { onSwitchingCompany } from "../../../../store/slices/helperSlice"

const SelectCompanyToView = ({ data }) => {
    const { switchingCompanyInfo } = useSelector((state) => state.helper)
    const dispatch = useDispatch()
    const closeModal = () => {
        return dispatch(onSwitchingCompany(false))
    }
    return (
        <Modal
            title={renderingTitle(`Our record shows you are assigned to ${data.length} companies, please select which company you want to work with today.`)}
            open={switchingCompanyInfo}
            onCancel={() => closeModal()}
            footer={[]}
            centered
            width={1000}>
            <Grid display={'flex'} justifyContent={'space-between'} alignItems={'center'} padding={'12px 20px'} container>
                <Space size={[8,16]} wrap>
                    {
                        data.map(item => {
                            return (
                                <CompanyChoiceCard key={item.companyInfo.id} props={item} />
                            )
                        })
                    }
                </Space>
            </Grid>
        </Modal>
    )
}

export default SelectCompanyToView