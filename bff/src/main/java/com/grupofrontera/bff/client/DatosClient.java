package com.grupofrontera.bff.client;

import com.grupofrontera.bff.dto.CiudadDTO;
import com.grupofrontera.bff.dto.EstadoDTO;
import com.grupofrontera.bff.dto.FuenteDTO;
import com.grupofrontera.bff.dto.FuenteRequestDTO;
import com.grupofrontera.bff.dto.ProductoDTO;
import com.grupofrontera.bff.dto.ProductoRequestDTO;
import com.grupofrontera.bff.dto.RegionDTO;
import com.grupofrontera.bff.dto.StockAjusteDTO;
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

    // Regiones (catalogo geografico)
    @GET
    @Path("/regiones")
    List<RegionDTO> listarRegiones();

    @POST
    @Path("/regiones")
    Response crearRegion(RegionDTO request);

    // Ciudades (catalogo geografico, filtrable por region)
    @GET
    @Path("/ciudades")
    List<CiudadDTO> listarCiudades(@QueryParam("regionId") Long regionId);

    @POST
    @Path("/ciudades")
    Response crearCiudad(CiudadDTO request);

    // Productos
    @GET
    @Path("/productos")
    List<ProductoDTO> listarProductos(
            @QueryParam("sucursalId") Long sucursalId,
            @QueryParam("categoria") String categoria,
            @QueryParam("q") String q,
            @QueryParam("activo") Boolean activo);

    @GET
    @Path("/productos/{id}")
    ProductoDTO obtenerProducto(@PathParam("id") Long id);

    @POST
    @Path("/productos")
    Response crearProducto(ProductoRequestDTO request);

    @PUT
    @Path("/productos/{id}")
    ProductoDTO actualizarProducto(@PathParam("id") Long id, ProductoRequestDTO request);

    @PUT
    @Path("/productos/{id}/estado")
    ProductoDTO cambiarEstadoProducto(@PathParam("id") Long id, EstadoDTO request);

    @PUT
    @Path("/productos/{id}/stock")
    ProductoDTO ajustarStockProducto(@PathParam("id") Long id, StockAjusteDTO request);

    @POST
    @Path("/productos/importar")
    Response importarProductos(List<ProductoRequestDTO> request);

    @GET
    @Path("/productos/categorias")
    List<String> listarCategorias();
}
