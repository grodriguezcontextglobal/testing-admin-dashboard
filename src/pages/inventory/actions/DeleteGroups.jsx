import { Box, FormControlLabel, Radio, RadioGroup, Typography } from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { devitrakApi } from "../../../api/devitrakApi";
import BlueButtonConfirmationComponent from "../../../components/UX/buttons/BlueButtonConfirmation";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import MultiSelectComponent from "../../../components/UX/dropdown/MultiSelectComponent";
import SelectComponent from "../../../components/UX/dropdown/SelectComponent";
import ModalUX from "../../../components/UX/modal/ModalUX";

const DeleteGroups = ({ openModal, closeModal, refetch, user }) => {
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedGroup, setSelectedGroup] = useState("");
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [deleteMode, setDeleteMode] = useState("selected");

    const inventoryQuery = useQuery({
        queryKey: ["inventory"],
        queryFn: () =>
            devitrakApi.post("/db_item/consulting-item", {
                company_id: user.sqlInfo.company_id,
            }),
    });
    const items = inventoryQuery.data?.data?.items;

    const categories = [...new Set(items?.map((item) => item.category_name))].map(category => ({ id: category, label: category }));
    const groups = [
        ...new Set(
            items
                ?.filter((item) => item?.category_name === selectedCategory)
                ?.map((item) => item?.item_group)
        ),
    ]?.map(group => ({ id: group, label: group }));

    const itemsToDisplay = items
        ?.filter(
            (item) =>
                item?.category_name === selectedCategory &&
                item?.item_group === selectedGroup
        )
        ?.map((item) => ({ id: item?.serial_number, label: item?.serial_number }));

    const handleCategoryChange = (value) => {
        setSelectedCategory(value.id);
        setSelectedGroup("");
        setSelectedItems(new Set());
    };

    const handleGroupChange = (value) => {
        setSelectedGroup(value?.id);
        setSelectedItems(new Set());
    };

    const handleItemChange = (value) => {
        setSelectedItems(value);
    };

    const deleteMutation = useMutation({
        mutationFn: (itemsToDelete) =>
            devitrakApi.post("/db_item/delete-bulk-items-criteria", itemsToDelete),
        onSuccess: () => {
            inventoryQuery.refetch();
            refetch();
            closeModal();
        },
    });

    const isDeleteDisabled = () => {
        if (deleteMode === 'category') return !selectedCategory;
        if (deleteMode === 'group') return !selectedGroup;
        if (deleteMode === 'selected') return selectedItems.size === 0;
        return true;
    };

    const handleDelete = () => {
        let itemsToDelete = {};
        itemsToDelete.company_id = user.sqlInfo.company_id;
        if (deleteMode === 'selected') {
            itemsToDelete.serial_number = Array.from(selectedItems);
            itemsToDelete.category_name = selectedCategory;
            itemsToDelete.item_group = selectedGroup;

        } else if (deleteMode === 'group') {
            itemsToDelete.category_name = selectedCategory;
            itemsToDelete.item_group = selectedGroup;
        } else if (deleteMode === 'category') {
            itemsToDelete.category_name = selectedCategory;
        }
        return deleteMutation.mutate(itemsToDelete);
    };
    const bodyModl = <form id="delete-form">
        < Typography variant="h6">Delete Item Groups</Typography>
        <div style={{ margin: "1rem 0" }}>
            <RadioGroup
                row
                aria-label="delete-mode"
                name="delete-mode"
                value={deleteMode}
                onChange={(e) => setDeleteMode(e.target.value)}
            >
                <FormControlLabel value="selected" control={<Radio />} label="Delete by selection" />
                <FormControlLabel value="group" control={<Radio />} label="Delete by group" />
                <FormControlLabel value="category" control={<Radio />} label="Delete by category" />
            </RadioGroup>
        </div>
        <div style={{ margin: "1rem 0" }}>
            <SelectComponent
                label="Category"
                placeholder="Select a category"
                items={categories}
                onSelect={handleCategoryChange}
                value={selectedCategory}
            />
        </div>
        {
            (deleteMode === 'selected' || deleteMode === 'group') && <div style={{ margin: "1rem 0" }}>
                <SelectComponent
                    label="Group"
                    placeholder="Select a group"
                    items={groups}
                    onSelect={handleGroupChange}
                    value={selectedGroup}
                    disabled={!selectedCategory}
                />
            </div>
        }
        {
            deleteMode === 'selected' && <div style={{ margin: "1rem 0" }}>
                <MultiSelectComponent
                    label="Items"
                    placeholder="Select items to delete"
                    items={itemsToDisplay}
                    selectedKeys={selectedItems}
                    onSelectionChange={handleItemChange}
                    disabled={!selectedGroup}
                />
            </div>
        }
    </form >
    return (
        <ModalUX openDialog={openModal} closeModal={() => closeModal(false)} body={bodyModl} footer={
            <Box display="flex" justifyContent="flex-end" style={{ gap: "1rem", marginTop: "1rem" }}>
                <GrayButtonComponent buttonType="reset" func={() => closeModal(false)} title="Cancel" styles={{ width: "50%" }} />
                <BlueButtonConfirmationComponent
                    title="Delete"
                    func={(e) => {
                        e.preventDefault();
                        handleDelete();
                    }}
                    isDisabled={isDeleteDisabled()}
                    isLoading={deleteMutation.isPending}
                    buttonType="submit"
                    form="delete-form"
                    confirmationTitle="Are you sure you want to delete this item group?"
                    confirmationDescription="This action cannot be undone."
                    styles={{ width: "50%" }}
                />
            </Box>
        } />
    );
};

export default DeleteGroups;
