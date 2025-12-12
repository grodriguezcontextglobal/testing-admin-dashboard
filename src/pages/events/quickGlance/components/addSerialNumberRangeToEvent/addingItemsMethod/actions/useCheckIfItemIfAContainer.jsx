import { groupBy } from "lodash";

const checkIfItemIfAContainer = ({ data, event, deviceTitle }) => {
  console.log(data);
  console.log(event);
  console.log(deviceTitle);
  const containers = groupBy(data, "container");
  console.log(containers);
  if(containers[1]){
    console.log(containers[1]);
  } else {
    console.log("No containers found");
  }
};

export default checkIfItemIfAContainer;
