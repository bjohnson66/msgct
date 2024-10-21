#include <stdio.h>
#include <math.h>

#define MU 398600500000.0 // Earth's gravitational constant in m^3/s^2
#define OMEGA_DOT_E 7.2921151467e-5 // Earth's rotation rate in rad/s

typedef struct {
    double SQRT_A;
    double Eccentricity;
    double OrbitalInclination;
    double RightAscenAtWeek;
    double ArgumentOfPerigee;
    double MeanAnom;
    double TimeOfApplicability;
    double RateOfRightAscen;
} SatelliteData;

typedef struct {
    double x;
    double y;
    double z;
} Position;

Position calculateSatellitePosition(
    SatelliteData satelliteData,
    double t,
    double deltaN,
    double cuc,
    double cus,
    double crc,
    double crs,
    double cic,
    double cis,
    double IDOT
) {
    // Convert SQRT_A to semi-major axis
    double A = satelliteData.SQRT_A * satelliteData.SQRT_A;

    // Compute mean motion (n)
    double n_0 = sqrt(MU / pow(A, 3));
    double n = n_0 + deltaN; // Corrected mean motion (n)

    // Time from ephemeris reference epoch
    double t_k = t - satelliteData.TimeOfApplicability;
    if (t_k > 302400) t_k -= 604800; // Week crossover correction
    if (t_k < -302400) t_k += 604800;

    // Calculate the mean anomaly at time t
    double M_k = satelliteData.MeanAnom + (n * t_k);

    // Solve Kepler's equation for eccentric anomaly
    double E_k = M_k; // Initial guess
    for (int j = 0; j < 3; j++) {
        E_k = E_k + (M_k - E_k + satelliteData.Eccentricity * sin(E_k)) / (1 - satelliteData.Eccentricity * cos(E_k));
    }

    // Calculate the true anomaly
    double v_k = 2 * atan(sqrt((1 + satelliteData.Eccentricity) / (1 - satelliteData.Eccentricity)) * tan(E_k / 2));

    // Argument of latitude
    double phi_k = v_k + satelliteData.ArgumentOfPerigee;

    // Latitude correction
    double delta_u_k = (cus * sin(2 * phi_k)) + (cuc * cos(2 * phi_k));

    // Radius correction
    double delta_r_k = (crs * sin(2 * phi_k)) + (crc * cos(2 * phi_k));

    // Inclination correction
    double delta_i_k = (cis * sin(2 * phi_k)) + (cic * cos(2 * phi_k));

    // Corrected argument of latitude
    double u_k = phi_k + delta_u_k;

    // Corrected radius
    double r_k = A * (1 - (satelliteData.Eccentricity * cos(E_k))) + delta_r_k;

    // Corrected inclination
    double i_k = satelliteData.OrbitalInclination + delta_i_k + (IDOT * t_k);

    // Orbital plane positions (x', y')
    double x_prime_k = r_k * cos(u_k);
    double y_prime_k = r_k * sin(u_k);

    // Corrected right ascension of ascending node
    double omega_k = satelliteData.RightAscenAtWeek + ((satelliteData.RateOfRightAscen - OMEGA_DOT_E) * t_k) - (OMEGA_DOT_E * satelliteData.TimeOfApplicability);

    // Earth-fixed coordinates (x, y, z)
    Position pos;
    pos.x = (x_prime_k * cos(omega_k)) - (y_prime_k * cos(i_k) * sin(omega_k));
    pos.y = (x_prime_k * sin(omega_k)) + (y_prime_k * cos(i_k) * cos(omega_k));
    pos.z = y_prime_k * sin(i_k);

    return pos;
}

int main() {
    SatelliteData satelliteData = {
        .SQRT_A = 5153.75480270,
        .Eccentricity = 0.0167867515702,
        .OrbitalInclination = 0.903782727230,
        .RightAscenAtWeek = -0.657960408566,
        .ArgumentOfPerigee = 0.173129682312,
        .MeanAnom = -0.286954703389,
        .TimeOfApplicability = 0,
        .RateOfRightAscen = -0.868929051526e-8
    };

    double deltaN = 0.583845748090e-08;
    double cuc = -0.379979610443e-6;
    double cus = 0.277347862720e-5;
    double crc = 0.293218750000e+3;
    double crs = -0.965625000000e+1;
    double cic = 0.199303030968e-6;
    double cis = 0.173225998878e-6;
    double IDOT = 0.789318592573e-10;

    double t = 2100.0; // GPST 7 Jan 2018 00:35:00.0

    Position result = calculateSatellitePosition(satelliteData, t, deltaN, cuc, cus, crc, crs, cic, cis, IDOT);

    printf("Calculated Position:\n");
    printf("X: %.6f meters\n", result.x);
    printf("Y: %.6f meters\n", result.y);
    printf("Z: %.6f meters\n", result.z);

    // Expected values from Table 5 (Precise Ephemeris)
    double expectedX = 3166191.446;
    double expectedY = -21511947.161;
    double expectedZ = -15899624.824;

    printf("Expected Position:\n");
    printf("X: %.6f meters\n", expectedX);
    printf("Y: %.6f meters\n", expectedY);
    printf("Z: %.6f meters\n", expectedZ);

    // Comparison (simple tolerance check)
    if (fabs(result.x - expectedX) < 1e-2 && fabs(result.y - expectedY) < 1e-2 && fabs(result.z - expectedZ) < 1e-2) {
        printf("Position matches within tolerance.\n");
    } else {
        printf("Position does not match expected values.\n");
    }

    return 0;
}
