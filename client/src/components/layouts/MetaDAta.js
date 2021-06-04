import React from "react";
import { Helmet } from "react-helmet";

const MetaDAta = ({ title }) => {
  return (
    <Helmet>
      <title>{`${title} - shopIt`}</title>
    </Helmet>
  );
};

export default MetaDAta;
