import { redirect } from "next/navigation";

export default function PollingStationRedirectPage({
  params,
}: {
  params: { ps_code: string };
}) {
  redirect(
    `/voters-management/polling-stations?ps_code=${encodeURIComponent(
      params.ps_code
    )}`
  );
}
