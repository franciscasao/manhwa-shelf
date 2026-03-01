import PocketBase from "pocketbase";

let cachedPB: PocketBase | null = null;

export async function getServerPB(): Promise<PocketBase> {
  if (cachedPB?.authStore.isValid) {
    return cachedPB;
  }

  const pb = new PocketBase(
    process.env.NEXT_PUBLIC_POCKETBASE_URL ?? "http://127.0.0.1:8090",
  );
  pb.autoCancellation(false);

  const email = process.env.PB_ADMIN_EMAIL;
  const password = process.env.PB_ADMIN_PASSWORD;

  if (email && password) {
    await pb.collection("_superusers").authWithPassword(email, password);
  }

  cachedPB = pb;
  return pb;
}
