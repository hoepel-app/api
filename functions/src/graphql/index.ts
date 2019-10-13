import * as admin from 'firebase-admin';
import { ApolloServer, gql, IResolvers } from 'apollo-server-express';
import { createChildRepository } from '../services/child.service';
import { createConsumableRepository } from '../services/consumable.service';
import { createAgeGroupRepository } from '../services/age-group.service';
import { createShiftRepository, ShiftService } from '../services/shift.service';
import {
  createChildAttendanceByChildRepository,
  createChildAttendanceByShiftRepository,
} from '../services/child-attendance.service';
import { DayDate, DocumentNotFoundError, IChild, IShift, ICrew, Consumable, IConsumable } from '@hoepel.app/types';
import { createCrewRepository } from '../services/crew.service';
import { createCrewAttendanceByShiftRepository, createCrewAttendanceByCrewRepository } from '../services/crew-attendance.service';

const db = admin.firestore();

// Debug MaxListenersExceededWarning - TODO remove
process.on('warning', err => console.warn(err.stack));

// Schema
const typeDefs = gql`

  type Address {
    street: String
    number: String
    zipCode: Int
    city: String
  }

  type TenantContactPerson {
    name: String
    phone: String
    email: String
  }

  type PhoneContact {
    phoneNumber: String!
    comment: String
  }

  type Tenant {
    id: ID!
    name: String

    address: Address # Actually, does not contain street and number but streetAndNumber...
    description: String
    contactPerson: TenantContactPerson
    email: String
    logoUrl: String
    logoSmallUrl: String
    privacyPolicyUrl: String
  }

  # interface Person {
  #   firstName: String!
  #   lastName: String!
  # }

  type Child {
    id: ID!

    firstName: String!
    lastName: String!
    tenant: Tenant!
    address: Address
    phone: [PhoneContact]
    email: [String]
    gender: String
    contactPeople: [ChildContactPersonRelation]
    # birthDate: AWSDate
    remarks: String
    managedByParents: [String]
    uitpasNumber: String

    attendances: [ChildAttendance]
  }

  type CrewMember {
    id: ID!
    tenant: Tenant!

    firstName: String!
    lastName: String!
    address: Address
    active: Boolean
    bankAccount: String
    phone: [PhoneContact]
    email: [String]
    yearStarted: Int
    # birthDate: AWSDate
    certificates: CrewCertificates
    remarks: String

    attendances: [CrewMemberAttendance]
  }

  type CrewCertificates {
    hasPlayworkerCertificate: Boolean
    hasTeamleaderCertificate: Boolean
    hasTrainerCertificate: Boolean
  }

  type Day {
    id: ID!

    shifts: [Shift]
    # uniqueAttendances: Int
    consumptions: [Consumption]
  }

  type Shift {
    id: ID!
    tenant: Tenant!

    day: Day!
    # price: Price!
    childrenCanBePresent: Boolean!
    crewCanBePresent: Boolean!
    kind: String!
    location: String
    description: String
    # startAndEnd: StartAndEnd

    childAttendances: [ChildAttendance]
    crewMemberAttendances: [CrewMemberAttendance]
  }

  type AgeGroup {
    tenant: Tenant!

    name: String!
    # bornOnOrAfter: AWSDate
    # bornOnOrBefore: AWSDate
  }

  type ChildAttendance {
    child: Child!
    shift: Shift!

    didAttend: Boolean!

    enrolled: String #Timestamp
    enrolledRegisteredBy: String

    arrived: String #Timestamp
    arrivedRegisteredBy: String

    left: String #Timestamp
    leftRegisteredBy: String

    ageGroup: AgeGroup
    amountPaid: Int
    discounts: [String]
  }

  type CrewMemberAttendance {
    id: ID!
    tenant: Tenant!

    crewMember: CrewMember!
    shift: Shift!

    didAttend: Boolean!
    enrolled: String #Timestamp
    ageGroup: AgeGroup
  }

  type ContactPerson {
    id: ID!
    tenant: Tenant!

    firstName: String!
    lastName: String!

    address: Address
    phone: [PhoneContact]
    email: [String]
    remarks: String
  }

  type ChildContactPersonRelation {
    relationship: String
    contactPerson: ContactPerson
  }

  type Consumable {
   tenant: Tenant!

    name: String!
    price: Int!
  }

  type Consumption {
    id: ID!
    tenant: Tenant!

    child: Child!
    dayId: String! #AWSDate!
    consumable: Consumable!
    pricePaid: Int!
  }

  type Query {
    children(tenant: String, howMany: Int): [Child]
    shifts(tenant: String, howMany: Int): [Shift]
    crewMembers(tenant: String, howMany: Int): [CrewMember]
    day(tenant: String, dayId: String!): Day
    consumables(tenant: String): [Consumable]
  }
`;

// Repos
const childRepo = createChildRepository(db);
const consumableRepo = createConsumableRepository(db);
const ageGroupRepo = createAgeGroupRepository(db);
const shiftRepo = createShiftRepository(db);
const consumptionRepo = createConsumptionRepository(db);
const crewRepo = createCrewRepository(db);
const childAttendanceByChildRepo = createChildAttendanceByChildRepository(db);
const crewAttendanceByCrewRepo = createCrewAttendanceByCrewRepository(db);
const childAttendanceByShiftRepo = createChildAttendanceByShiftRepository(db);
const crewAttendanceByShiftRepo = createCrewAttendanceByShiftRepository(db);
const shiftService = new ShiftService(shiftRepo);
const consumptionService = new ConsumptionService(consumptionRepo);

// Utils
const addTenant = <T>(entity: T, tenant: string): T & { tenant: string } => {
  return { tenant, ...entity }
};

const addTenantAll = <T>(entities: readonly T[], tenant: string): readonly T[] => {
  return entities.map(entity => addTenant(entity, tenant));
};


// Resolvers
const getTenant = async (tenant: string) => {
  return db.collection('tenants').doc(tenant).get().then(snapshot => {
    return {
      id: tenant,
      ...snapshot.data(),
    }
  });
};

const getChildren = async (obj, args: { howMany: number, tenant: string }) => childRepo
  .getAll(args.tenant, args.howMany)
  .then(list => addTenantAll(list, args.tenant));

const getShifts = async (obj, args: { howMany: number, tenant: string }) => shiftRepo
  .getAll(args.tenant, args.howMany)
  .then(list => addTenantAll(list, args.tenant));

const getCrewMembers = async (obj, args: { howMany: number, tenant: string }) => crewRepo
  .getAll(args.tenant, args.howMany)
  .then(list => addTenantAll(list, args.tenant));

const getContactPerson = async (id: string) => {
  return db.collection('contact-people').doc(id).get().then(snapshot => {
    return {
      id,
      ...snapshot.data(),
    }
  })
};

const getAttendancesForChild = async (tenant: string, childId: string) => {
  const doc = await childAttendanceByChildRepo.get(tenant, childId);

  return Object.entries(doc.attendances).map(( [shiftId, details] ) => {
    return {
      child: childId,
      shift: shiftId,
      tenant,

      ...details,
    }
  });
};

const getAttendancesForCrewMember = async (tenant: string, crewMemberId: string) => {
  const doc = await crewAttendanceByCrewRepo.get(tenant, crewMemberId);

  return Object.entries(doc.attendances).map(( [shiftId, details] ) => {
    return {
      crewMember: crewMemberId,
      shift: shiftId,
      tenant,

      ...details,
    }
  });
};

const getChildAttendancesForShift = async (tenant: string, shiftId: string) => {
  const doc = await childAttendanceByShiftRepo.get(tenant, shiftId);

  return Object.entries(doc.attendances).map(( [childId, details] ) => {
    return {
      child: childId,
      shift: shiftId,
      tenant,

      ...details,
    }
  });
};

const getCrewMemberAttendancesForShift = async (tenant: string, shiftId: string) => {
  const doc = await crewAttendanceByShiftRepo.get(tenant, shiftId);

  return Object.entries(doc.attendances).map(( [crewMemberId, details] ) => {
    return {
      crewMember: crewMemberId,
      shift: shiftId,
      tenant,

      ...details,
    }
  });
};

const getShiftsOnDay = async (tenant: string, dayId: string) => {
  return shiftService.getShiftsOnDay(tenant, DayDate.fromDayId(dayId));
};
};

const getConsumptionsOnDay = async (tenant: string, dayId: string) => {
  return consumptionService.getShiftsOnDay(tenant, DayDate.fromDayId(dayId));
};

const getAgeGroup = async (parent: { ageGroupName: string, tenant: string }) => {
  try {
    const ageGroups = await ageGroupRepo.get(parent.tenant);

    if (ageGroups.groups && ageGroups.groups.find(group => group.name === parent.ageGroupName)) {
      return ageGroups.groups.find(group => group.name === parent.ageGroupName);
    } else {
      return null;
    }
  } catch (err) {
    if (err instanceof DocumentNotFoundError) {
      return null;
    } else {
      throw err;
    }
  }
};

const getConsumables = async (obj, args: { tenant: string }): Promise<readonly Consumable[]> => {
  try {
    return addTenantAll(await consumableRepo.get(args.tenant), args.tenant);
  } catch (err) {
    if (err instanceof DocumentNotFoundError) {
      return [];
    } else {
      throw err;
    }
  }
};


//Resolver map
const resolvers: IResolvers = {
  Query: {
    children: getChildren,
    shifts: getShifts,
    crewMembers: getCrewMembers,
    day: (_, args: { dayId: string, tenant: string }) => {
      const day = DayDate.fromDayId(args.dayId); // will fail on invalid dayId
      return { tenant: args.tenant, id: day.toDayId() };
    },
    consumables: getConsumables,
  },
  Child: {
    tenant: (parent: { tenant: string }) => getTenant(parent.tenant),
    attendances: (parent: IChild & { tenant: string }) => getAttendancesForChild(parent.tenant, parent.id),
    },
  ChildContactPersonRelation: {
    contactPerson: (parent: { relationship: string, contactPersonId: string }) => getContactPerson(parent.contactPersonId)
  },
  ChildAttendance: {
    shift: async (parent: { shift: string, tenant: string }) => {
      return addTenant(await shiftRepo.get(parent.tenant, parent.shift), parent.tenant)
    },
    child: async (parent: { child: string, tenant: string }) => {
      return addTenant(await childRepo.get(parent.tenant, parent.child), parent.tenant);
    },
    ageGroup: getAgeGroup,
  },
  CrewMemberAttendance: {
    shift: async (parent: { shift: string, tenant: string }) => {
      return addTenant(await shiftRepo.get(parent.tenant, parent.shift), parent.tenant)
    },
    crewMember: async (parent: { crewMember: string, tenant: string }) => {
      return addTenant(await crewRepo.get(parent.tenant, parent.crewMember), parent.tenant);
    },
    ageGroup: getAgeGroup,
  },
  Shift: {
    tenant: (parent: IShift & { tenant: string }) => getTenant(parent.tenant),
    childAttendances: (parent: IShift & { tenant: string }) => getChildAttendancesForShift(parent.tenant, parent.id),
    crewMemberAttendances: (parent: IShift & { tenant: string }) => getCrewMemberAttendancesForShift(parent.tenant, parent.id),
    day: (parent: IShift & { tenant: string}) => ({ id: parent.dayId, tenant: parent.tenant }),
  },
  Day: {
    shifts: (parent: { tenant: string, id: string }) => getShiftsOnDay(parent.tenant, parent.id),
    consumptions: (parent: { tenant: string, id: string }) => getConsumptionsOnDay(parent.tenant, parent.id),
  },
  CrewMember: {
    tenant: (parent: IShift & { tenant: string }) => getTenant(parent.tenant),
    attendances: (parent: ICrew & { tenant: string }) => getAttendancesForCrewMember(parent.tenant, parent.id),
  },
  Consumable: {
    tenant: (parent: IConsumable & { tenant: string }) => getTenant(parent.tenant),
  },

};


// Build server
export const graphqlServer = new ApolloServer({ typeDefs, resolvers });
