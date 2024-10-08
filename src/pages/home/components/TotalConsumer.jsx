import { lazy, Suspense } from "react";
import { useSelector } from "react-redux";
// import CardRendered from "../../events/quickGlance/components/CardRendered";
import { useNavigate } from "react-router-dom";
import Loading from "../../../components/animation/Loading";
import CenteringGrid from "../../../styles/global/CenteringGrid";
const CardRendered = lazy(() =>
  import("../../events/quickGlance/components/CardRendered")
);
const TotalConsumer = () => {
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  return (
    <Suspense
      fallback={
        <div style={CenteringGrid}>
          <Loading />
        </div>
      }
    >
      <button
        style={{
          backgroundColor: "transparent",
          outline: "none",
          margin: 0,
          padding: 0,
          width: "100%",
        }}
        onClick={() => navigate(`/staff`)}
      >
        <CardRendered
          props={user.companyData.employees.length}
          title={"Total staff members"}
        />
      </button>
    </Suspense>
  );
};

export default TotalConsumer;

// const [consumersList, setConsumersList] = useState([])
// const totalConsumers = useCallback(async () => {
//     const response = await devitrakApi.post('/auth/users', {
//         provider: user.company
//     })
//     if (response.data.ok) {
//         sortingDataFetched(response.data.users)
//     }
// }, [])

// useEffect(() => {
//     const controller = new AbortController()
//     totalConsumers()

//     return () => {
//       controller.abort()
//     }
//   }, [])

// const sortingDataFetched = (props) => {
//     const result = new Set()
//     for (let data of props) {
//         const jsonToString = JSON.stringify(data)
//         result.add(jsonToString)
//     }

//     const finalList = new Set()
//     for (let data of Array.from(result)) {
//         const stringToJson = JSON.parse(data)
//         finalList.add(stringToJson)
//     }
//     const consumers = Array.from(finalList)
//     return setConsumersList(consumers)
// }
