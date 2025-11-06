import React, { useState } from "react";
import { ProjectDetails, User } from "../types";
import FileUpload from "./FileUpload";
import {
  PriceTagIcon,
  UserIcon,
  InfoIcon,
  ShoppingCartIcon,
} from "./icons/Icons";

interface ProjectControlsProps {
  onFileUpload: (file: File) => void;
  onListProject: (details: ProjectDetails) => void;
  projectDetails: ProjectDetails;
  setProjectDetails: React.Dispatch<React.SetStateAction<ProjectDetails>>;
  isListed: boolean;
  isLoading: boolean;
  error: string | null;
  hasProject: boolean;
  progress: { percent: number; stage: string } | null;
  user: User;
}

const ProgressDisplay: React.FC<{
  progress: { percent: number; stage: string };
}> = ({ progress }) => (
  <div className="text-center p-4">
    <p className="text-sm font-medium text-gray-300 mb-2">{progress.stage}</p>
    <div className="w-full bg-gray-700 rounded-full h-2.5">
      <div
        className="bg-indigo-500 h-2.5 rounded-full transition-all duration-300 ease-in-out"
        style={{ width: `${progress.percent}%` }}
      ></div>
    </div>
    <p className="text-xs text-gray-400 mt-2">
      {Math.round(progress.percent)}%
    </p>
  </div>
);

const ProjectControls: React.FC<ProjectControlsProps> = ({
  onFileUpload,
  onListProject,
  projectDetails,
  setProjectDetails,
  isListed,
  isLoading,
  error,
  hasProject,
  progress,
  user,
}) => {
  const [internalDetails, setInternalDetails] =
    useState<ProjectDetails>(projectDetails);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setInternalDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onListProject(internalDetails);
  };

  const SellerView = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Project Title
        </label>
        <input
          type="text"
          name="title"
          id="title"
          value={internalDetails.title}
          onChange={handleInputChange}
          className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Description
        </label>
        <textarea
          name="description"
          id="description"
          rows={4}
          value={internalDetails.description}
          onChange={handleInputChange}
          className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>
      <div>
        <label
          htmlFor="price"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Price (USD)
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <PriceTagIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="number"
            name="price"
            id="price"
            step="0.01"
            min="0"
            value={internalDetails.price}
            onChange={handleInputChange}
            className="w-full pl-10 bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
      </div>
      {!user.isKYCVerified && (
        <div className="bg-yellow-900/20 border border-yellow-500/20 text-yellow-300 px-4 py-3 rounded-lg mb-4">
          <p className="text-sm">
            <strong>KYC Verification Required:</strong> You need to complete KYC
            verification to list projects for sale. Please contact support to
            verify your identity.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={!user.isKYCVerified}
        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors duration-200 ${
          user.isKYCVerified
            ? "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
            : "bg-gray-600 cursor-not-allowed opacity-50"
        }`}
      >
        {user.isKYCVerified ? "List for Sale" : "KYC Required to List"}
      </button>
    </form>
  );

  const BuyerView = () => (
    <div className="space-y-6 text-gray-300">
      <h2 className="text-3xl font-bold text-white tracking-tight">
        {projectDetails.title}
      </h2>

      <div className="flex items-center space-x-3 text-gray-400">
        <UserIcon className="h-5 w-5" />
        <span className="font-medium">{projectDetails.seller}</span>
      </div>

      <div>
        <h3 className="flex items-center text-lg font-semibold text-gray-100 mb-2">
          <InfoIcon className="h-5 w-5 mr-2" />
          Description
        </h3>
        <p className="text-gray-400 leading-relaxed">
          {projectDetails.description}
        </p>
      </div>

      <div className="bg-gray-700/50 rounded-lg p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">Price</p>
          <p className="text-3xl font-bold text-white">
            ${projectDetails.price}
          </p>
        </div>
        <button
          onClick={() =>
            alert(
              `Purchasing "${projectDetails.title}" for $${projectDetails.price}. \n(This is a demo action)`
            )
          }
          className="flex items-center justify-center py-3 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 transition-colors duration-200"
        >
          <ShoppingCartIcon className="h-5 w-5 mr-2" />
          Buy Now
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {isLoading && progress ? (
        <ProgressDisplay progress={progress} />
      ) : (
        <FileUpload onFileUpload={onFileUpload} disabled={isLoading} />
      )}

      {error && (
        <p className="text-red-400 text-sm bg-red-900/50 p-3 rounded-md">
          {error}
        </p>
      )}

      {hasProject && (
        <div className="pt-6 border-t border-gray-700">
          {isListed ? <BuyerView /> : <SellerView />}
        </div>
      )}
    </div>
  );
};

export default ProjectControls;
