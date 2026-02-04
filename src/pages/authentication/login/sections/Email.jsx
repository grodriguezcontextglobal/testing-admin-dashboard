const Email = ({
  handleSubmit,
  onSubmitEmail,
  formFittingTrigger,
  Grid,
  FormLabel,
  Input,
  BlueButtonComponent,
  isLoading,
  forceLogin,
  register,
}) => {
  return (
    <form
      onSubmit={handleSubmit(onSubmitEmail)}
      style={{ width: formFittingTrigger() }}
    >
      <Grid
        marginY={"20px"}
        marginX={0}
        textAlign={"left"}
        item
        xs={12}
        sm={12}
        md={12}
        lg={12}
      >
        <FormLabel style={{ marginBottom: "0.9rem" }}>Email</FormLabel>
        <Input
          required={!forceLogin}    
          {...register("email", {
            required: !forceLogin,
            minLength: 10,
          })}
          type="email"
          placeholder="Enter your email"
          fullWidth
        />
      </Grid>
      <BlueButtonComponent
        disabled={false}
        loadingState={isLoading}
        buttonType="submit"
        title="Continue"
        styles={{ width: "100%" }}
      />
    </form>
  );
};

export default Email;
