export const renderingTernary = (props, compare, col1, col2, col3) => {
    if (typeof props === compare) {
      return col1;
    } else {
      if (props) return col2;
      return col3;
    }
  };
