import { useContext } from "react";
import { AuthContext } from "../context/auth/AuthContext";
import InternalLayout from "../components/InternalLayout";

const SettingsPage = () => {
  const auth = useContext(AuthContext);
  const user = auth?.user as { firstName: string; lastName: string; email: string } | null;

  return (
    <InternalLayout>
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Settings</h1>

        {/* Account */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Account
          </h2>
          <div className="bg-white border rounded-xl divide-y">
            <div className="flex items-center justify-between px-4 py-4">
              <span className="text-sm text-gray-500">Name</span>
              <span className="text-sm font-medium text-gray-800">
                {user ? `${user.firstName} ${user.lastName}` : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-4">
              <span className="text-sm text-gray-500">Email</span>
              <span className="text-sm font-medium text-gray-800">
                {user?.email ?? "—"}
              </span>
            </div>
          </div>
        </section>

        {/* App */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            App
          </h2>
          <div className="bg-white border rounded-xl divide-y">
            <div className="flex items-center justify-between px-4 py-4">
              <span className="text-sm text-gray-500">Notifications</span>
              <span className="text-xs text-gray-400">Coming soon</span>
            </div>
            <div className="flex items-center justify-between px-4 py-4">
              <span className="text-sm text-gray-500">Theme</span>
              <span className="text-xs text-gray-400">Coming soon</span>
            </div>
          </div>
        </section>

        {/* Session */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Session
          </h2>
          <div className="bg-white border rounded-xl">
            <button
              onClick={() => auth?.logout()}
              className="w-full text-left px-4 py-4 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
            >
              Log out
            </button>
          </div>
        </section>
      </div>
    </InternalLayout>
  );
};

export default SettingsPage;
