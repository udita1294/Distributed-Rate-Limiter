// This file is implementing the Strategy Design Pattern
// The purpose of this file is:  Given an algorithm name, return the corresponding algorithm function.

import {fixedWindow} from "../algorithms/fixedWindow.js";

export function getAlgorithm(algorithmName){

    switch(algorithmName){
        
        case "fixedWindow": 
            return fixedWindow;

        default:
            throw new Error(`Algorithm ${algorithmName} is not supported`);
    }
}