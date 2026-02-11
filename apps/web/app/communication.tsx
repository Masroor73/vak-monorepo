import ManagerLayout from "./layouts/ManagerLayout";

export default function Communication() {
  return (
    <ManagerLayout>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border">
          <h2 className="text-lg font-semibold mb-4">Create Announcement</h2>

          <div className="space-y-3">
            <div>
              <p className="text-sm mb-1">Select Date</p>
              <input type="date" className="w-full border rounded px-3 py-2" />
            </div>

            <div>
              <p className="text-sm mb-1">Audience</p>
              <select className="w-full border rounded px-3 py-2">
                <option>All Employees</option>
                <option>Managers</option>
              </select>
            </div>

            <div>
              <p className="text-sm mb-1">Category</p>
              <select className="w-full border rounded px-3 py-2">
                <option>General</option>
                <option>Urgent</option>
              </select>
            </div>

            <div>
              <p className="text-sm mb-1">Title</p>
              <input
                type="text"
                placeholder="Announcement Title"
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <p className="text-sm mb-1">Message</p>
              <textarea
                placeholder="Message"
                className="w-full border rounded px-3 py-2 h-28"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button className="border px-4 py-2 rounded">Save Draft</button>
            <button className="bg-red-500 text-white px-4 py-2 rounded">
              Discard
            </button>
            <button className="bg-blue-500 text-white px-4 py-2 rounded">
              Post
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border">
          <h2 className="text-lg font-semibold mb-4">Direct Messages</h2>

          <div className="space-y-4">
            <div className="bg-gray-100 p-4 rounded">
              <div className="flex justify-between">
                <p className="font-semibold">Daniel Cormier</p>
                <p className="text-xs text-gray-500">05-12-2025</p>
              </div>
              <p className="text-sm font-medium">Feedback On Training</p>
              <p className="text-sm text-gray-600 mt-1">
                Thank you for organizing the training. It was very engaging and
                informative.
              </p>
            </div>

            <div className="bg-gray-100 p-4 rounded">
              <div className="flex justify-between">
                <p className="font-semibold">Jon Jones</p>
                <p className="text-xs text-gray-500">05-12-2025</p>
              </div>
              <p className="text-sm font-medium">Feedback On Training</p>
              <p className="text-sm text-gray-600 mt-1">
                Thank you for organizing the training. It was great meeting
                everyone.
              </p>
            </div>
          </div>

          <p className="text-blue-600 mt-4 cursor-pointer text-right">
            View All →
          </p>
        </div>
      </div>
    </ManagerLayout>
  );
}
