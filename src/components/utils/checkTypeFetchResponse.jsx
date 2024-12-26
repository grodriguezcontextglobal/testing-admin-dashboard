const checkTypeFetchResponse = (props) => {
  return typeof props === "string" ? JSON.parse(props) : props;
};

export default checkTypeFetchResponse;
