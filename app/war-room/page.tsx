import { redirect } from "next/navigation";

export default function WarRoomPage() {
  // Redirect to the main war room page under voters-management
  redirect("/voters-management/war-room");
}
