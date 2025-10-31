import { useEffect, useState } from "react";
import { FiTrash2 } from "react-icons/fi";

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, statusMessage }) {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (statusMessage) {
      setShowAnimation(true);
    } else {
      setShowAnimation(false);
    }
  }, [statusMessage]);

  if (!isOpen) return null;

  return (
    //     <div className="fixed inset-0 bg-gray-100/20 z-50 flex items-center justify-center">

    //  <div data-aos="zoom-in" className="bg-white rounded-lg shadow-md p-6 w-full max-w-xl relative">
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div data-aos="zoom-in" className="bg-white rounded-lg shadow-md p-6 w-full max-w-xl relative">
        {/* Close Button */}
        <form method="dialog">
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          >
            ✕
          </button>
        </form>

        {statusMessage ? (
          <div
            className={`flex flex-col items-center gap-4 ${showAnimation
              ? "opacity-100 scale-100 transition duration-500 ease-out"
              : "opacity-0 scale-90"
              }`}
          >
            <FiTrash2 className="text-red-600 text-4xl animate-bounce" />
            {/* <h2 className="text-lg font-semibold text-gray-800">
              {statusMessage.includes("Cannot delete") ? "Cannot Delete" : "Deleted!"}
            </h2> */}
            <h2 className="text-lg font-semibold text-gray-800">
              {statusMessage.toLowerCase().includes("cannot") || statusMessage.toLowerCase().includes("used in a question set")
                ? "Cannot Delete"
                : "Deleted!"}
            </h2>

            <p className="text-sm text-gray-700 text-center">{statusMessage}</p>
          </div>
        ) : (
          <>
            {/* Confirm Delete UI */}
            <div className="flex justify-center gap-2 mb-4">
              <FiTrash2 className="text-red-600 text-2xl" />
              <h2 className="text-lg font-semibold  text-gray-800">Confirm Delete</h2>
            </div>

            <p className="text-sm text-gray-600 mb-6 text-center">
              Delete this item? This action cannot be undone.
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </>
        )}

      </div>
    </div>

  );
}
