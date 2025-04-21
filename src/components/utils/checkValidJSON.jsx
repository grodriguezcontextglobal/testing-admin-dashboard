export const checkValidJSON = (json) => {
  if (typeof json === "string") {
    JSON.parse(json);
  } else {
    return json;
  }
};
