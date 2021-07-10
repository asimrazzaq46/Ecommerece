import React, { Fragment, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useAlert } from "react-alert";
import { MDBDataTable } from "mdbreact";

import { allUsers, clearError } from "../../actions";
import MetaDAta from "../layouts/MetaDAta";
import Loader from "../layouts/Loader";
import Sidebar from "./Sidebar";

// import { DELETE_USER_RESET } from "../../constants/userConstants";

const UsersList = () => {
  const alert = useAlert();
  const dispatch = useDispatch();

  const { error, loading, users } = useSelector((state) => state.allUsers);
  //   const { isDeleted } = useSelector((state) => state.user);

  const setUsers = () => {
    const data = {
      columns: [
        {
          label: "User Id",
          field: "id",
          sort: "asc",
        },
        {
          label: "Name",
          field: "name",
          sort: "asc",
        },
        {
          label: "Email",
          field: "email",
          sort: "asc",
        },
        {
          label: "Role",
          field: "role",
          sort: "asc",
        },
        {
          label: "Actions",
          field: "actions",
        },
      ],
      rows: [],
    };

    users.forEach((user) => {
      data.rows.push({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,

        actions: (
          <Fragment>
            <Link
              to={`/admin/user/${user._id}`}
              className="btn btn-primary py-1 px-2"
            >
              <i className="fa fa-pencil"></i>
            </Link>
            <button className="btn btn-danger py-1 px-2 ml-2">
              <i className="fa fa-trash"></i>
            </button>
          </Fragment>
        ),
      });
    });

    return data;
  };

  //   const deleteUserHandler = (id) => {
  //     dispatch(deleteOrder(id));
  //   };

  useEffect(() => {
    dispatch(allUsers());

    if (error) {
      alert.error(error);
      dispatch(clearError());
    }

    // if (isDeleted) {
    //   alert.success("ORDER Deleted Successfully");
    //   history.push("/admin/orders");
    //   dispatch({ type: DELETE_ORDER_RESET });
    // }
  }, [dispatch, alert, error]);
  return (
    <Fragment>
      <MetaDAta title={"All Users"} />
      <div className="row">
        <div className="col-12 col-md-2">
          <Sidebar />
        </div>
        <div className="col-12 col-md-10">
          <Fragment>
            <h1 className="my-5">All Users</h1>
            {loading ? (
              <Loader />
            ) : (
              <MDBDataTable
                data={setUsers()}
                className="px-3"
                bordered
                striped
                hover
              />
            )}
          </Fragment>
        </div>
      </div>
    </Fragment>
  );
};

export default UsersList;
