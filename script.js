document.addEventListener('DOMContentLoaded', function () {
    const gradientPlugin = {
        id: 'applyGradient',
        beforeDraw: chart => {
            const ctx = chart.ctx;
            const chartArea = chart.chartArea;
            let gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
            gradient.addColorStop(0, 'rgba(255, 0, 0, 0.2)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 0, 0.2)');
            gradient.addColorStop(1, 'rgba(0, 255, 0, 0.2)');
            ctx.fillStyle = gradient;
            ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
        }
    };

    Chart.register(gradientPlugin);

    function calculateMissionReadiness(jobs, equipment, events, mission) {
        const totalRequired = 2;
        const jobReadiness = (jobs[mission] / totalRequired) * 100;
        const equipmentReadiness = (equipment[mission] / totalRequired) * 100;
        const eventReadiness = (events[mission] / totalRequired) * 100;
        return (jobReadiness + equipmentReadiness + eventReadiness) / 3;
    }

    function readinessColor(percentage) {
        if (percentage <= 60) return 'red';
        if (percentage <= 85) return 'yellow';
        return 'green';
    }

    function getColoredCircle(color) {
        const circleUnicode = '\u25CF';
        return `<span style="color: ${color};">${circleUnicode}</span>`;
    }

    const modal = document.getElementById("infoModal");
    const modalText = document.getElementById("modalText");
    const span = document.getElementsByClassName("close")[0];

    span.onclick = function() {
        modal.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    function showInfoModal(centerId, units) {
        const center = units[centerId];
        if (center) {
            let modalContent = `Unit ${centerId}: <br> Phase: ${center.phase} <br>`;

            ['A', 'B', 'C'].forEach(mission => {
                const missionColorCircle = getColoredCircle(center.missionColors[mission]);
                modalContent += `<strong>Mission ${mission}:</strong> ${missionColorCircle} <br>`;

                const jobColorCircle = getColoredCircle(readinessColor(calculateMissionReadiness(center.jobs, center.equipment, center.events, mission)));
                modalContent += `<span style="margin-left: 20px;">P-Pillar (Job ${mission}): ${jobColorCircle}</span> <br>`;

                const equipmentColorCircle = getColoredCircle(readinessColor(calculateMissionReadiness(center.jobs, center.equipment, center.events, mission)));
                modalContent += `<span style="margin-left: 20px;">E-Pillar (Equipment ${mission}): ${equipmentColorCircle}</span> <br>`;

                const eventColorCircle = getColoredCircle(readinessColor(calculateMissionReadiness(center.jobs, center.equipment, center.events, mission)));
                modalContent += `<span style="margin-left: 20px;">T-Pillar (Event ${mission}): ${eventColorCircle}</span> <br>`;
            });

            modalText.innerHTML = modalContent;
            modal.style.display = "block";
        }
    }

    // Declare units at a higher scope to access it outside fetch
    let units = {};

    // Fetch data from the JSON file
    fetch('data.json')
        .then(response => response.json())
        .then(loadedUnits => {
            units = loadedUnits;
            const phases = {
                'Maintenance': [],
                'Basic': [],
                'Advanced': [],
                'Sustainment': []
            };

            for (const id in units) {
                const center = units[id];
                center.missionReadiness = {
                    A: calculateMissionReadiness(center.jobs, center.equipment, center.events, 'A'),
                    B: calculateMissionReadiness(center.jobs, center.equipment, center.events, 'B'),
                    C: calculateMissionReadiness(center.jobs, center.equipment, center.events, 'C')
                };

                center.missionColors = {
                    A: readinessColor(center.missionReadiness.A),
                    B: readinessColor(center.missionReadiness.B),
                    C: readinessColor(center.missionReadiness.C)
                };

                center.readiness = (center.missionReadiness.A + center.missionReadiness.B + center.missionReadiness.C) / 3;

                phases[center.phase].push({ id, ...center });
            }

            for (const phase in phases) {
                createPhaseChart(phase, phases[phase], units); // Pass units to createPhaseChart
            }
            displayResources(units);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });

function displayResources(units) {
    const resourceContainer = document.getElementById('resourceContainer');
    resourceContainer.innerHTML = ''; // Clear previous content

    Object.keys(units).forEach(unitId => {
        const unit = units[unitId];

        // Create a container for each unit
        const unitContainer = document.createElement('div');
        unitContainer.className = 'unit-container';
        resourceContainer.appendChild(unitContainer);

        // Create unit box
        const unitDiv = document.createElement('div');
        unitDiv.className = 'unit';
        unitDiv.id = `unit-${unitId}`;

        // Add unit title
        const unitTitle = document.createElement('h3');
        unitTitle.innerText = `Unit ${unitId}`;
        unitDiv.appendChild(unitTitle);

        // Create P-Pillar (Jobs) container
        const pPillarDiv = document.createElement('div');
        pPillarDiv.className = 'category';
        const pPillarTitle = document.createElement('h4');
        pPillarTitle.innerText = 'P-Pillar (Jobs)';
        pPillarDiv.appendChild(pPillarTitle);

        // Populate P-Pillar (Jobs)
        Object.keys(unit.jobs).forEach(job => {
            const jobDiv = document.createElement('div');
            jobDiv.className = 'resource';
            jobDiv.draggable = true;
            jobDiv.id = `jobs-${job}-${unitId}`;
            jobDiv.innerText = `${job}: ${unit.jobs[job]}`;
            jobDiv.addEventListener('dragstart', handleDragStart);
            pPillarDiv.appendChild(jobDiv);
        });

        // Create E-Pillar (Equipment) container
        const ePillarDiv = document.createElement('div');
        ePillarDiv.className = 'category';
        const ePillarTitle = document.createElement('h4');
        ePillarTitle.innerText = 'E-Pillar (Equipment)';
        ePillarDiv.appendChild(ePillarTitle);

        // Populate E-Pillar (Equipment)
        Object.keys(unit.equipment).forEach(equipment => {
            const equipmentDiv = document.createElement('div');
            equipmentDiv.className = 'resource';
            equipmentDiv.draggable = true;
            equipmentDiv.id = `equipment-${equipment}-${unitId}`;
            equipmentDiv.innerText = `${equipment}: ${unit.equipment[equipment]}`;
            equipmentDiv.addEventListener('dragstart', handleDragStart);
            ePillarDiv.appendChild(equipmentDiv);
        });

        // Append P-Pillar and E-Pillar to unit box
        unitDiv.appendChild(pPillarDiv);
        unitDiv.appendChild(ePillarDiv);

        // Append unit box to its container
        unitContainer.appendChild(unitDiv);
        unitDiv.addEventListener('dragover', function(event) {
                event.preventDefault(); // Allow drop
        });
        unitDiv.addEventListener('drop', handleDrop);
    });
}

function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.id);
}

function handleDrop(e) {
    e.preventDefault();
    const data = e.dataTransfer.getData('text');
    const draggableElement = document.getElementById(data);
    const dropzone = e.target.closest('.unit'); // Ensure the dropzone is a unit

    if (!dropzone) return; // Exit if dropzone is not a unit

    // Extract details from the draggable element's ID
    const [category, item, sourceUnitId] = draggableElement.id.split('-');
    const destinationUnitId = dropzone.id.replace('unit-', '');

    if (sourceUnitId !== destinationUnitId) {
        // Check for valid resource counts before transfer
        if (units[sourceUnitId][category][item] > 0) {
            units[sourceUnitId][category][item]--;
            units[destinationUnitId][category][item]++;

            // Redraw resources and charts
            displayResources(units);
            //updateCharts(phases, units); // A new function to update all charts

            // Optionally, send updated data to the server
            sendUpdatedData(units);
        }
    }
}


function sendUpdatedData(updatedUnits) {
    console.log('Sending updated data to server:', updatedUnits);  // Log data being sent

    fetch('/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUnits),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

    function createPhaseChart(phaseName, phaseData, units) { // Add units parameter
        const canvasId = phaseName.toLowerCase() + 'Chart';
        const canvas = document.getElementById(canvasId);

        if (!canvas) {
            console.error('Canvas element not found:', canvasId);
            return;
        }
        const ctx = canvas.getContext('2d');

        let gradient = ctx.createLinearGradient(0, 0, 0, canvas.clientHeight);
        gradient.addColorStop(0, 'rgba(0, 255, 0, 0.2)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 0, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0.2)');

        const chartData = phaseData.map(center => ({
            x: center.daysToNextPhase,
            y: center.readiness,
            r: 5,
            id: center.id
        }));

        new Chart(ctx, {
            type: 'bubble',
            data: {
                datasets: [{
                    label: 'Unit Data',
                    data: chartData,
                    backgroundColor: 'rgba(0, 123, 255, 1)'
                }]
            },
            options: {
                layout: {
                    padding: {
                        top: 30
                    }
                },
                scales: {
                    x: {
                       beginAtZero: true,
                       reverse: true,
                       grid: {
                          color: 'white'
                       },
                       ticks: {
                          color: 'white',
                          font: {
                            size: 14,
                            weight: 'bold'
                          }
                        },
                      title: {
                          display: true,
                          text: 'Days to Next Phase',
                          color: 'white',
                          font: {
                            size: 16,
                            weight: 'bold'
                          }
                       }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                           color: 'white'
                        },
                        title: {
                            display: false,
                            text: 'Readiness Level'
                        },
                        min: 0,
                        max: 100,
                        ticks: {
                            display: false
                        }
                    }
                },
                onHover: (event, chartElement) => {
                    if (chartElement.length) {
                        const elementIndex = chartElement[0].index;
                        const centerId = phaseData[elementIndex].id;
                        showInfoModal(centerId, units); // Pass the loaded units data to showInfoModal
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: phaseName,
                        font: {
                            size: 28,
                            weight: 'bold',
                            family: 'Arial'
                        },
                        color: 'white',
                        padding: {
                            top: 10,
                            bottom: 10
                        }
                    },
                    legend: {
                        display: false,
                    }
                },
                applyGradient: gradientPlugin
            }
        });
    }

    for (const phase in phases) {
        createPhaseChart(phase, phases[phase]);
    }
});