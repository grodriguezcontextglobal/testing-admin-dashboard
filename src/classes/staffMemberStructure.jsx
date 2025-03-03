import { checkArray } from "../components/utils/checkArray";

class StaffMemberStructure {
  constructor(companyInfo, staffMemberInfo, role) {
    this.companyInfo = companyInfo;
    this.staffMemberInfo = staffMemberInfo;
    this.role = role;
  }
  fromEventPage() {
    return {
      id: this.staffMemberInfo.id,
      name: `${this.staffMemberInfo.name} ${this.staffMemberInfo.lastName}`,
      online: this.staffMemberInfo.online,
      role: this.role,
      email: this.staffMemberInfo.email,
      phone: this.staffMemberInfo.phone,
      photo: this.staffMemberInfo.imageProfile,
    };
  }
  fromStaffPage() {
    const preferenceFoundInCompany = this.companyInfo.employees.find(
      (employee) => employee.user === this.staffMemberInfo.email
    );
    return {
      ...this.fromEventPage(),
      role: this.fromEventPage().role,
      active: this.fromEventPage().online,
      firstName: this.staffMemberInfo.name,
      lastName: this.staffMemberInfo.lastName,
      adminUserInfo: {
        ...this.staffMemberInfo,
        id: this.fromEventPage().id,
      },
      companyData: this.companyInfo,
      entireData: {
        id: this.staffMemberInfo.id,
        preference: checkArray(preferenceFoundInCompany).preference,
        user: this.fromEventPage().email,
        firstName: this.staffMemberInfo.name,
        lastName: this.staffMemberInfo.lastName,
        status: this.staffMemberInfo.active,
        super_user: this.staffMemberInfo.super_user,
        role: this.staffMemberInfo.role,
        active: this.staffMemberInfo.active,
        _id: this.staffMemberInfo.id,
        email: this.fromEventPage().email,
        adminUserInfo: {
          ...this.staffMemberInfo,
          id: this.fromEventPage().id,
        },
        companyData: this.companyInfo,
      },
    };
  }
}

export default StaffMemberStructure;
