export function roundTo2Decimals(num: number): number {
    return Math.round(num * 100) / 100;
}

export function getElapsedDays(currentDate: string, prevDate: string) {
    if (!currentDate || !prevDate) return 0;
    const differenceInMilliseconds = Number(new Date(currentDate)) - Number(new Date(prevDate));
    const differenceInDays = differenceInMilliseconds / (1000 * 60 * 60 * 24);
    return differenceInDays;
}

export function convertDate(originalDate: string) {
    const parsedDate = new Date(originalDate);
    const day = parsedDate.getUTCDate().toString().padStart(2, '0');
    const month = (parsedDate.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = parsedDate.getFullYear().toString();
    return day + month + year;
}


// Methods to save data in firebase
import { db } from "../firebase.js";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { InfoData } from "../model/Types";

export async function savePrevAndCurrentDataToTable(selectedBuilding: string, info: InfoData[]) {
    try {
        const docRef = doc(db, "LAST BILL", selectedBuilding);

        // Build the data object to save
        const data = {
            currentDate: {
                date: info[0].date,
                buildingConsumption: info[0].buildingConsumption,
                floors: info[0].floors
            },
            prevDate: {
                date: info[1].date,
                buildingConsumption: info[1].buildingConsumption,
                floors: info[1].floors
            }
        };

        await setDoc(docRef, data);

        console.log("Datos guardados correctamente en Firebase.");
    } catch (error) {
        console.error("Error al guardar datos en Firebase:", error);
    }
}

export async function saveDataBasedOnDays(selectedBuilding: string, info: InfoData[], setSnackbar: (value: boolean) => void, setText: (value: string) => void) {
    try {
        const collectionName = selectedBuilding;

        await info.map(async (infoItem: InfoData) => {
            const documentId = convertDate(infoItem.date);
            const docRef = doc(db, collectionName, documentId);

            // If the document already exists, we exit the function
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setText("Ya existe información guardada en las fechas seleccionadas");
                setSnackbar(true);
                console.log("El documento ya existe en la colección personalizada.");
                return;
            }

            // If the document does not exist, we will save the data
            const data = {
                "consumo total": infoItem.buildingConsumption,
                "5to piso": infoItem.floors[0],
                "4to piso": infoItem.floors[1],
                "3er piso": infoItem.floors[2],
                "2do piso": infoItem.floors[3],
            };
            await setDoc(docRef, data);

            setText("Los datos han sido guardados exitosamente");
            setSnackbar(true);
            console.log("Datos guardados correctamente en la colección personalizada.");
        });
    } catch (error) {
        console.error("Error al guardar datos en la colección personalizada:", error);
    }
}