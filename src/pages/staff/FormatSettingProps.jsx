import { Button, Grid, MenuItem, Select, Typography } from "@mui/material";
import { useState } from "react";
import { useAdminStore } from "../../../hooks/useAdminStore";
import {
  Avatar,
  Card,
  Divider,
  Popconfirm,
  Skeleton,
  notification,
} from "antd";
import { EditOutlined, DeleteOutlined, UserOutlined } from "@ant-design/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { devitrakApi, devitrakApiAdmin } from "../../api/devitrakApi";
const FormatSettingProps = ({ props, sendObjectIdUser }) => {
  const { Meta } = Card;
  const { user } = useAdminStore();
  const [permissionStatus, setPermissionStatus] = useState(false);
  const [permissionUpdated, setPermissionUpdated] = useState("");
  const adminUserRole = Number(user.role);
  const handleEditAdminPermission = async () => {
    setPermissionStatus(!permissionStatus);
  };

  const clientQuery = useQueryClient();
  const updateAdminUserPermissionMutation = useMutation({
    mutationFn: (adminProfile) =>
      devitrakApi.patch(`/admin/admin-user/${adminProfile.id}`, adminProfile),
    onSuccess: clientQuery.invalidateQueries(["listOfAdminUsers"]),
  });

  const updatePermission = async () => {
    const newAdminObj = {
      ...props,
      role: permissionUpdated,
    };
    updateAdminUserPermissionMutation.mutate(newAdminObj);
    setPermissionStatus(false);
    setPermissionUpdated("");
  };

  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, content) => {
    api.open({
      message: content.title,
      description: content.description,
    });
  };
  const confirm = async () => {
    try {
      const resp = await devitrakApiAdmin.delete(`/${sendObjectIdUser}`);
      if (resp)
        return openNotificationWithIcon("Success", {
          title: "Admin deleted",
          description: "admin user was deleted",
        });
    } catch (error) {
      return openNotificationWithIcon("error", {
        title: "Upss!",
        description: "There was an error, Please try again later",
      });
    }
  };
  return (
    <>
      {contextHolder}
      <Card
        style={{
          width: "30rem",
        }}
        actions={[
          <EditOutlined
            onClick={handleEditAdminPermission}
            size={50}
            disabled={
              // adminUserRole === "Approver" || adminUserRole === "Administrator"
              adminUserRole === "Approver" || adminUserRole === "Administrator"
                ? false
                : true
            }
            key="edit"
          />,
          <Popconfirm
            key={props.email}
            placement="bottomLeft"
            title="Are you sure?"
            description="This admin user will be deleted permanently"
            onConfirm={confirm}
          >
            <DeleteOutlined size={50} key="delete" />
          </Popconfirm>,
        ]}
      >
        <Skeleton loading={false} avatar active>
          <Meta
            avatar={<Avatar size="large" icon={<UserOutlined />} />}
            title={
              <Typography variant="h3">
                {props.name}, {props.lastName}
              </Typography>
            }
            description={
              <>
                <Typography
                  display={"flex"}
                  variant="h6"
                  onClick={handleEditAdminPermission}
                >
                  {props.role}
                </Typography>
                <Divider />
                <label>Phone: </label>&nbsp;
                <span>{props.phone ? props.phone : "XXX-XXX-XXXX"}</span>
                <Divider />
                <label>Email: </label>&nbsp;
                <span>{props.email}</span>
              </>
            }
          />
        </Skeleton>
        <Grid paddingTop={5} item xs={12}>
          {permissionStatus === true && (
            <Select
              fullWidth
              value={permissionUpdated}
              onChange={(event) => setPermissionUpdated(event.target.value)}
            >
              <MenuItem value="">Please select permission</MenuItem>
              <MenuItem value="Administrator">Administrator</MenuItem>
              <MenuItem value="Approver">Approver</MenuItem>
              <MenuItem value="Editor">Editor</MenuItem>
            </Select>
          )}
        </Grid>
        <Divider />
        <Grid gap={2} item xs={12}>
          {permissionStatus === true && (
            <>
              <Button
                variant="outlined"
                color="error"
                style={{ width: "fit-content" }}
                onClick={handleEditAdminPermission}
              >
                Cancel
              </Button>
              <Divider type="vertical" />
              <Button
                variant="contained"
                color="primary"
                style={{ width: "fit-content" }}
                onClick={updatePermission}
              >
                Save
              </Button>
            </>
          )}
        </Grid>
      </Card>
    </>
  );
};

export default FormatSettingProps;
