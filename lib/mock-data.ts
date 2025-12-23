// Mock data for demo mode when API is unavailable
import type {
  Stats,
  WardStats,
  Voter,
  Family,
  Election,
  Candidate,
} from "./api";

export const mockStats: Stats = {
  list_id: 1,
  total_voters: 3591,
  male_count: 1939,
  female_count: 1652,
  total_wards: 12,
  average_age: 34.5,
};

export const mockWardStats: WardStats[] = [
  { ward_no: "01", voter_count: 340, male_count: 182, female_count: 158 },
  { ward_no: "02", voter_count: 210, male_count: 115, female_count: 95 },
  { ward_no: "03", voter_count: 505, male_count: 271, female_count: 234 },
  { ward_no: "04", voter_count: 120, male_count: 68, female_count: 52 },
  { ward_no: "05", voter_count: 289, male_count: 154, female_count: 135 },
  { ward_no: "06", voter_count: 412, male_count: 220, female_count: 192 },
  { ward_no: "07", voter_count: 198, male_count: 109, female_count: 89 },
  { ward_no: "08", voter_count: 356, male_count: 191, female_count: 165 },
  { ward_no: "09", voter_count: 267, male_count: 143, female_count: 124 },
  { ward_no: "10", voter_count: 445, male_count: 238, female_count: 207 },
  { ward_no: "11", voter_count: 234, male_count: 125, female_count: 109 },
  { ward_no: "12", voter_count: 215, male_count: 123, female_count: 92 },
];

export const mockVoters: Voter[] = [
  {
    voter_id: 104,
    serial_no: "104",
    name: "Rakesh Kumar",
    name_hindi: "राकेश कुमार",
    relative_name: "s/o Mohan Lal",
    relative_name_hindi: "पुत्र मोहन लाल",
    house_no: "15",
    age: 45,
    gender: "Male",
    ward_no: "04",
    voter_id_number: "ABC1234567",
  },
  {
    voter_id: 105,
    serial_no: "105",
    name: "Sita Devi",
    name_hindi: "सीता देवी",
    relative_name: "w/o Rakesh Kumar",
    relative_name_hindi: "पत्नी राकेश कुमार",
    house_no: "15",
    age: 42,
    gender: "Female",
    ward_no: "04",
    voter_id_number: "ABC1234568",
  },
  {
    voter_id: 106,
    serial_no: "106",
    name: "Amit Kumar",
    name_hindi: "अमित कुमार",
    relative_name: "s/o Rakesh Kumar",
    relative_name_hindi: "पुत्र राकेश कुमार",
    house_no: "15",
    age: 19,
    gender: "Male",
    ward_no: "04",
    voter_id_number: "ABC1234569",
  },
];

export const mockFamilies: Family[] = [
  {
    ward_no: "04",
    house_no: "15",
    address: "Main Street, Ward 04",
    member_count: 3,
    members: mockVoters,
  },
  {
    ward_no: "04",
    house_no: "16",
    address: "Main Street, Ward 04",
    member_count: 2,
    members: [
      {
        voter_id: 107,
        serial_no: "107",
        name: "Priya Sharma",
        name_hindi: "प्रिया शर्मा",
        relative_name: "d/o Ram Sharma",
        relative_name_hindi: "पुत्री राम शर्मा",
        house_no: "16",
        age: 28,
        gender: "Female",
        ward_no: "04",
      },
      {
        voter_id: 108,
        serial_no: "108",
        name: "Vijay Sharma",
        name_hindi: "विजय शर्मा",
        relative_name: "s/o Ram Sharma",
        relative_name_hindi: "पुत्र राम शर्मा",
        house_no: "16",
        age: 32,
        gender: "Male",
        ward_no: "04",
      },
    ],
  },
];

export const mockElections: Election[] = [
  {
    election_id: 1,
    election_name: "Panchayat Election 2024",
    election_date: "2024-05-15",
    election_type: "panchayat",
    status: "active",
    list_id: 1,
    created_at: "2024-01-10T10:00:00Z",
  },
];

export const mockCandidates: Candidate[] = [
  {
    candidate_id: 1,
    list_id: 1,
    name: "Rakesh Kumar",
    party_name: "Independent",
    party_symbol: "🪷",
    ward_no: "04",
    status: "active",
    voter_id: 104,
    age: 45,
    gender: "Male",
  },
  {
    candidate_id: 2,
    list_id: 1,
    name: "Mahesh Verma",
    party_name: "BJP",
    party_symbol: "🪷",
    ward_no: "03",
    status: "active",
    age: 52,
    gender: "Male",
  },
];
