export const checkArray = (props) => {
    if (Array.isArray(props)) {
      return props.at(-1);
    } else {
      return props;
    }
  };
