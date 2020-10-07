import icon_statistik from "../models/model-icon-statistik";
import DataApiCovid from "../models/model-api-covid";
import moment from "moment";

class ApiCovid {
    constructor() {
    }

    static getByStatus(data) {
        const n = nomor => {
            return nomor.toLocaleString("id-ID", { minimumFractionDigits: 0 });
        };

        let clsAdd = "";
        let clsName = "";
        let clsBg = "bg-white";
        if(data.judul.toLowerCase() === "total terkonfirmasi") {
            clsAdd = 'style="color: white;"';
            clsName = "statistik-terkonfirmasi";
            clsBg = "bg-primary";
        }

        const views = `
        <div class="col">
            <div class="card shadow-sm ${clsBg} rounded" ${clsAdd}>
                <div class="d-flex align-items-center h-100">
                    <div class="card-body ${clsName}">
                        <h5 class="card-title text-center judul">${data.judul}</h5>
                        <div class="row">
                            <div class="col">
                                <p class="text-center font-weight-bold">${data.countries}</p>
                                <h5 class="text-center font-weight-bold">${n(data.value.countries)}</h5>
                                <p class="text-center mb-0">
                                    ${data.icon}
                                </p>
                            </div>
                            <div class="col">
                                <p class="text-center font-weight-bold">Global</p>
                                <h5 class="text-center font-weight-bold">${n(data.value.global)}</h5>
                                <p class="text-center mb-0">
                                    ${data.icon}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;

        return views;
    }

    static getStatistik() {
        const api = async () => {
            const el = $("#app__statistik");

            try {
                const countries = "Indonesia";
                const resultCountries = await DataApiCovid.getCountries("Indonesia");
                const resultGlobal = await DataApiCovid.getSummaryGlobal();
                const countriesConfirmed = resultCountries.confirmed.value;
                const countriesRecovered = resultCountries.recovered.value;
                const countriesDeaths = resultCountries.deaths.value;
                const globalConfirmed = resultGlobal.confirmed.value;
                const globalRecovered = resultGlobal.recovered.value;
                const globalDeaths = resultGlobal.deaths.value;

                // get data terkonfirmasi
                const dataTerkonfirmasi = {
                    judul: "Total Terkonfirmasi",
                    countries: countries,
                    icon: icon_statistik.terkonfirmasi,
                    value: { countries: countriesConfirmed, global: globalConfirmed }
                };

                // get data dalam perawatan
                const perawatancountries = countriesConfirmed - (countriesRecovered + countriesDeaths);
                const perawatanGlobal = globalConfirmed - (globalRecovered + globalDeaths);
                const dataDalamPerawatan = {
                    judul: "Dalam Perawatan",
                    countries: countries,
                    icon: icon_statistik.perawatan,
                    value: { countries: perawatancountries, global: perawatanGlobal }
                };

                // get data sembuh
                const dataSembuh = {
                    judul: "Total Sembuh",
                    countries: countries,
                    icon: icon_statistik.sembuh,
                    value: { countries: countriesRecovered, global: globalRecovered }
                };

                // get data pasien meninggal
                const dataMeninggal = {
                    judul: "Pasien Meninggal",
                    countries: countries,
                    icon: icon_statistik.meninggal,
                    value: { countries: countriesDeaths, global: globalDeaths }
                };

                const byStatusTerkonfirmasi = this.getByStatus(dataTerkonfirmasi);
                const byStatusPerawatan = this.getByStatus(dataDalamPerawatan);
                const byStatusSembuh = this.getByStatus(dataSembuh);
                const byStatusMeninggal = this.getByStatus(dataMeninggal);

                const views = `
                <div class="row mt-4">
                    ${byStatusTerkonfirmasi}
                    ${byStatusPerawatan}
                    ${byStatusSembuh}
                    ${byStatusMeninggal}
                </div>
                `;

                el.append(views);

            } catch(message) {
                const views = `
                <div class="row mt-4">
                    <div class="col">
                        <div class="alert alert-warning mb-0" role="alert">
                            ${message}
                        </div>
                    </div>
                </div>
                `;

                el.append(views);
            }
        };
        api();
    }

    static getCountriesCovid() {
        const n = nomor => {
            return nomor.toLocaleString("en-US", { minimumFractionDigits: 0 });
        };

        const api = async () => {
            try {
                const countries = await DataApiCovid.getCountriesAll();
                let no = 1;

                let views = "";
                for(const country of countries.countries) {
                    const name = country.name;
                    const iso2 = country.iso2;
                    const iso3 = country.iso3;

                    if(name.toLowerCase() !== "gambia") {
                        try {
                            const resultCountries = await DataApiCovid.getCountries(name);
                            if(resultCountries.confirmed) {
                                const countriesConfirmed = resultCountries.confirmed.value;
                                const countriesRecovered = resultCountries.recovered.value;
                                const countriesDeaths = resultCountries.deaths.value;

                                views += `
                                <tr>
                                    <td>${no}</td>
                                    <!--<td>${iso2.toLowerCase() +' - '+ iso3}</td>-->
                                    <td>${name}</td>
                                    <td>${n(countriesConfirmed)}</td>
                                    <td>${n(countriesRecovered)}</td>
                                    <td>${n(countriesDeaths)}</td>
                                </tr>
                                `;

                                no++;
                            }

                        } catch(message) {
                        }
                    }
                }

                return views;

            } catch(message) {
                console.log(message);

                return "";
            }
        };

        return api();
    }

    static getGlobalCovidUpdates() {
        moment.locale("id");
        const tahunIni = moment().format("YYYY");
        const bulanIni = moment().format("M");

        const getTanggalAkhir = (tahun, bulan) => {
            let endDate;
            if(bulanIni == bulan) {
                endDate = moment().subtract(1, 'day').format("MM-DD-YYYY");

            } else {

                const startDate = moment([tahun, bulan - 1, 1]).format("YYYY-MM-DD");
                const daysInMonth = moment(startDate).daysInMonth();
                endDate = moment(startDate).add(daysInMonth - 1, 'days').format("MM-DD-YYYY");
            }

            return endDate;
        };

        const api = async () => {
            let data = [];

            for(let i = 1; i <= bulanIni; i++) {
                const tanggalAkhir = getTanggalAkhir(tahunIni, i);
                let confirmed = 0;

                try {
                    const covidDaily = await DataApiCovid.getDailyUpdates(tanggalAkhir);
                    for(const item of covidDaily) {
                        confirmed += parseInt(item.confirmed);
                    }

                } catch(message) {
                }

                const obj = { "date": tanggalAkhir, "value": confirmed };

                data = data.concat(obj);
            }

            return data;
        };

        return api();
    }
}

export default ApiCovid;