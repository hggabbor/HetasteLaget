import {useEffect, useRef, useState} from "react";
import {FirebaseOptions, initializeApp} from "firebase/app";
import {getDatabase, ref, onValue, get} from "firebase/database";
import BaseChart from "../../components/BaseChart";
import {ThemedText} from "@/components/ThemedText";
import {View} from "react-native";

export default function Index() {
    const firebaseConfig:FirebaseOptions = {
        apiKey: "AIzaSyBqmUEkalnwm9QpIFN2-uwvZSylbWOC5Zw",
        authDomain: "temperatur-9a74e.firebaseapp.com",
        databaseURL: "https://temperatur-9a74e-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "temperatur-9a74e",
        storageBucket: "temperatur-9a74e.firebasestorage.app",
        messagingSenderId: "502906004078",
        appId: "1:502906004078:web:20e3ee8ae39ad0260a3c7f",
        measurementId: "G-D0NN9ZVR2Z"
    };
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [chartData, setChartData] = useState([]);
    const dateInput = useRef(null);
    const divInput = useRef(null);
    const [divisions, setDivisions] = useState<number>(2);
    const [visibleDivs, setVisibleDivs] = useState<string>(divisions.toString());
    const [isValid, setIsValid] = useState<boolean>(true);


    const min = 1;
    const max = 60;

    initializeApp(firebaseConfig);
    const db = getDatabase();

    const getNextValue = (currentValue: number, newValue: number) => {
        let direction = currentValue < newValue;
        let num = newValue;

        while (max % num !== 0) {
            num += direction ? 1 : -1;

            if (num > max) {
                num = min;
            } else if (num < min) {
                num = max;
            }
        }

        return num;
    }

    useEffect(() => {
        let date = new Date(Date.now());
        if(dateInput.current) {
            // @ts-ignore
            dateInput.current.value = date.toISOString().split("T")[0];
        }
        setSelectedDate(date);
    }, [dateInput]);

    useEffect(() => {
        if (!selectedDate) return;

        const path = `Room/${selectedDate.getFullYear()}/${selectedDate.getMonth() + 1}/${selectedDate.getDate()}`;
        const dataRef = ref(db, path);
        get(dataRef).then(
            (snapshot) => {
                const data = snapshot.val();
                let chartData = [];

                for (let hour in data) {
                    let sections = [];
                    let minutesPerDivision = max / divisions;

                    for (let i = 0; i < divisions; i++) {
                        sections[i] = [];

                        for (let minute in data[hour]) {
                            if (Number(minute) <= i * minutesPerDivision)
                                sections[i].push(data[hour][minute]);
                        }
                    }

                    for (let i = 0; i < sections.length; i++) {
                        let temp = sections[i].reduce((n, {temperature}) => n + temperature, 0) / sections[i].length
                        let hum = sections[i].reduce((n, {humidity}) => n + humidity, 0) / sections[i].length

                        let formattedMinutes = (i * minutesPerDivision).toLocaleString('sv-SE', {
                            minimumIntegerDigits: 2,
                            useGrouping: false
                        })

                        if (!hum) continue;
                        if (!temp) continue;

                        chartData.push({
                            time: `${hour}:${formattedMinutes}`,
                            temperature: temp,
                            humidity: hum,
                        });
                    }
                }

                console.log(chartData);
                console.log(data);

                setChartData(chartData)
            });
    }, [db, selectedDate, divisions]);

    return (
        <div className="vh-100 vw-100 bg-dark overflow-x-hidden overflow-y-auto" data-bs-theme="dark">
            <div className="mt-4">
                <div className="w-100 row justify-content-evenly align-items-center mb-3">
                    <div className="col-12 col-sm-10 col-md-8 col-lg-5 my-3 my-md-0">
                        <ThemedText type="subtitle">Date:</ThemedText>
                        <input
                            id="dateSelect"
                            className="form-control"
                            type="date"
                            ref={dateInput}
                            onChange={(e) => setSelectedDate(e.target.valueAsDate)}
                        />
                    </div>
                    <div className="col-12 col-sm-10 col-md-8 col-lg-5 my-3 my-lg-0">
                        <ThemedText type="subtitle" className="my-3 my-lg-0">Readings per hour:</ThemedText>

                        <input
                            className={`form-control${isValid ? "" : " border-danger"}`}
                            type="number"
                            id="readingsHour"
                            ref={divInput}

                            value={visibleDivs}
                            onChange={(e) => {
                                let num:any = e.target.value;

                                if (!num) {
                                    setIsValid(false);
                                    setVisibleDivs(num);
                                    return;
                                }

                                num = e.target.valueAsNumber;
                                //setVisibleDivs(num);

                                let divs = getNextValue(divisions, num);


                                setDivisions(divs);
                                setVisibleDivs(divs);

                                setIsValid(max % divs === 0 && 0 < divs)
                            }}
                        />
                    </div>
                </div>

                <div className="row w-100 justify-content-evenly">
                    <div className="col-12 col-sm-10 col-md-8 col-lg-5 fs-3 mt-5">
                        <BaseChart
                            yAxisName="Temperature"
                            yKey="temperature"
                            xKey="time"
                            chartData={chartData}
                            lineColor="#5090DC"
                            title="Temperature in °C"
                        />
                    </div>
                    <div className="col-12 col-sm-10 col-md-8 col-lg-5 fs-3 mt-5">
                        <BaseChart
                            yAxisName="Humidity"
                            yKey="humidity"
                            xKey="time"
                            chartData={chartData}
                            lineColor="orange"
                            title="Humidity in %"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
