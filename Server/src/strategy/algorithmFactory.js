// This file is implementing the Strategy Design Pattern
// The purpose of this file is:  Given an algorithm name, return the corresponding algorithm function.

import {fixedWindow} from "../algorithms/fixedWindow.js";
import {slidingWindow} from "../algorithms/slidingWIndow.js";

export function getAlgorithm(algorithmName){

    switch(algorithmName){
        
        case "fixedWindow": 
            return fixedWindow;
        
        case "slidingWindow":
            return slidingWindow;

        default:
            throw new Error(`Algorithm ${algorithmName} is not supported`);
    }
}