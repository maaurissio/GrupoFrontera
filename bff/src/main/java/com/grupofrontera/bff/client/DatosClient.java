package com.grupofrontera.bff.client;

import com.grupofrontera.bff.dto.DatoConsolidadoDTO;
import com.grupofrontera.bff.dto.DatoConsolidadoRequestDTO;
import com.grupofrontera.bff.dto.EstadoDTO;
import com.grupofrontera.bff.dto.FuenteDTO;
import com.grupofrontera.bff.dto.FuenteRequestDTO;
import com.grupofrontera.bff.dto.LogTrazabilidadDTO;
import com.grupofrontera.bff.dto.SucursalDTO;
import com.grupofrontera.bff.dto.SucursalRequestDTO;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

@RegisterRestClient(configKey = "ms-datos")
@Path("/api/v1")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public interface DatosClient {

    // Fuentes
    @POST
    @Path("/fuentes")
    Response crearFuente(FuenteRequestDTO request);

    @GET
    @Path("/fuentes")
    List<FuenteDTO> listarFuentes();

    @GET
    @Path("/fuentes/{id}")
    FuenteDTO obtenerFuente(@PathParam("id") Long id);

    @PUT
    @Path("/fuentes/{id}")
    FuenteDTO actualizarFuente(@PathParam("id") Long id, FuenteRequestDTO request);

    @PUT
    @Path("/fuentes/{id}/estado")
    FuenteDTO cambiarEstadoFuente(@PathParam("id") Long id, EstadoDTO request);

    // Sucursales
    @POST
    @Path("/sucursales")
    Response crearSucursal(SucursalRequestDTO request);

    @GET
    @Path("/sucursales")
    List<SucursalDTO> listarSucursales();

    @GET
    @Path("/sucursales/{id}")
    SucursalDTO obtenerSucursal(@PathParam("id") Long id);

    @PUT
    @Path("/sucursales/{id}")
    SucursalDTO actualizarSucursal(@PathParam("id") Long id, SucursalRequestDTO request);

    @PUT
    @Path("/sucursales/{id}/estado")
    SucursalDTO cambiarEstadoSucursal(@PathParam("id") Long id, EstadoDTO request);

    // Datos Consolidados
    @POST
    @Path("/datos")
    Response recibirDato(DatoConsolidadoRequestDTO request);

    @GET
    @Path("/datos")
    List<DatoConsolidadoDTO> consultarDatos(
            @QueryParam("sucursalId") Long sucursalId,
            @QueryParam("tipoDato") String tipoDato,
            @QueryParam("periodoDesde") String periodoDesde,
            @QueryParam("periodoHasta") String periodoHasta,
            @QueryParam("estado") String estado);

    @GET
    @Path("/datos/{id}")
    DatoConsolidadoDTO obtenerDato(@PathParam("id") Long id);

    @GET
    @Path("/datos/errores")
    List<DatoConsolidadoDTO> listarErrores();

    @GET
    @Path("/datos/{id}/log")
    List<LogTrazabilidadDTO> obtenerLog(@PathParam("id") Long id);

    @POST
    @Path("/datos/{id}/reprocesar")
    DatoConsolidadoDTO reprocesar(@PathParam("id") Long id);

    @GET
    @Path("/datos/reportes/agrupados")
    Response reporteAgrupado(
            @QueryParam("periodoDesde") String periodoDesde,
            @QueryParam("periodoHasta") String periodoHasta,
            @QueryParam("tipoAgrupacion") String tipoAgrupacion);
}
