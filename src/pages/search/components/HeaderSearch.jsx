import { Typography } from '@mui/material'
import TextFontsize18LineHeight28 from '../../../styles/global/TextFontSize18LineHeight28'
import { Subtitle } from '../../../styles/global/Subtitle'
import { useMemo, useState } from 'react'
import { PropTypes } from 'prop-types'
const HeaderSearch = ({ countingResults, setFilterOptions }) => {
    const options = ['View All', 'Consumers', 'Staff', 'Devices', 'Events'] //'Posts', 
    const [activedParams, setActivedParams] = useState([])
    const handleActiveParams = (item) => {
        if (item === "View All") {
            return setActivedParams([])
        }
        if (activedParams.some(element => element === item)) {
            const result = activedParams.filter(element => element !== item)
            return setActivedParams(result)
        } else {
            const result = [...activedParams, item]
            return setActivedParams(result)
        }
    }
    const displayContentByFilter = useMemo(() => {
        if (activedParams.length < 1) return setFilterOptions({ 'View All': 1, 'Consumers': 0, 'Staff': 0, 'Devices': 0, 'Posts': 0, 'Events': 0 })
        if (activedParams.length > 0) {
            let ref = { 'View All': 0, 'Consumers': 0, 'Staff': 0, 'Devices': 0, 'Posts': 0, 'Events': 0 }
            for (let data of activedParams) {
                ref[data] = 1
            }
            return setFilterOptions(ref)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activedParams.length]) 


    return (
        <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: '20px 24px 0px 24px', gap: '20px', alignSelf: "stretch", backgroundColor: "#fff" }}>
            <div style={{ width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "center", alignSelf: "flex-start", padding: "0 0 20px 0" }}>
                <Typography style={{ ...TextFontsize18LineHeight28, width: "100%" }}>
                    Search results
                </Typography>
                <Typography style={{ ...Subtitle, width: "100%" }}>
                    There are {countingResults} results to your query
                </Typography>
            </div>
            <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", alignItems: "center", alignSelf: "flex-start" }}>
                {
                    options.map((item, index) => {
                        if (index === 0) {
                            return <button style={{
                                ...Subtitle,
                                background: `${activedParams.length === 0 ? "#EFF4FF" : 'var(--Gray-50, #F9FAFB)'}`,
                                border: '1px solid var(--Gray-300, #D0D5DD)',
                                boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.05)', borderRadius: "8px 0 0 8px"
                            }} key={item} onClick={() => handleActiveParams(item)}>{item}</button>
                        } else if (index === 4) {
                            return <button style={{
                                ...Subtitle,
                                background: `${activedParams.some(element => element === item) ? "#EFF4FF" : 'var(--Gray-50, #F9FAFB)'}`,
                                border: '1px solid var(--Gray-300, #D0D5DD)',
                                boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.05)', borderRadius: "0 8px 8px 0"
                            }} key={item} onClick={() => handleActiveParams(item)}>{item}</button>
                        }
                        return <button style={{
                            ...Subtitle,
                            background: `${activedParams.some(element => element === item) ? "#EFF4FF" : 'var(--Gray-50, #F9FAFB)'}`,
                            border: '1px solid var(--Gray-300, #D0D5DD)',
                            boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.05)', borderRadius: "0"
                        }} key={item} onClick={() => handleActiveParams(item)}>{item}</button >

                    })
                }
            </div >
        </div >
    )
}

export default HeaderSearch
HeaderSearch.propTypes = {
    countingResults: PropTypes.func,
    triggerFilters: PropTypes.func,
};