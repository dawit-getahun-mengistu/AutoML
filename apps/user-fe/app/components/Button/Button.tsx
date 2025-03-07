import React from "react";
import {FaSpinner } from "react-icons/fa";

interface Props {
  text: string;
  isDisabled?:boolean;
  loading?:boolean;
}

export default function Button({ text,isDisabled,loading }: Props) {
  return (
    <button 
    disabled={isDisabled||loading} 
    className="w-full font-bold text-lg rounded-xl flex items-center h-14 justify-center border my-2 bg-primary text-white">
     {loading ? (
        <>
          <FaSpinner className="animate-spin mr-2" /> 
          {text} 
        </>
      ) : (
        text
      )}
    </button> 
      
  );
}
